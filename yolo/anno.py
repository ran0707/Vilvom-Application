import sys
import os
import cv2
import json
import torch
import numpy as np
import random
import copy

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QFileDialog, QListWidget, QGraphicsView,
    QGraphicsScene, QGraphicsPixmapItem, QGraphicsPathItem,
    QGraphicsEllipseItem, QMenuBar, QAction, QToolBar, QInputDialog,
    QMessageBox, QGraphicsTextItem
)
from PyQt5.QtGui import (
    QPixmap, QImage, QPainterPath, QPen, QFont, QColor, QBrush,
    QPolygonF, QIcon
)
from PyQt5.QtCore import Qt, QRectF, QEvent, QPointF

# Using Ultralytics SAM (ensure the model file path is correct)
from ultralytics import SAM

# ---------------- Custom Editable Text Item ----------------
class EditableTextItem(QGraphicsTextItem):
    """
    This text item allows editing of an annotation's label.
    Double-clicking will prompt the user to update the label.
    Since we now allow different labels per annotation, no global check is enforced.
    """
    def __init__(self, text, parent_tool=None, image_filename=None):
        super().__init__()
        self.setPlainText(text)
        self.setTextInteractionFlags(Qt.TextEditorInteraction)
        self.setFlag(QGraphicsTextItem.ItemIsFocusable, True)
        self.parent_tool = parent_tool
        self.image_filename = image_filename

    def mouseDoubleClickEvent(self, event):
        original_text = self.toPlainText()
        new_text, ok = QInputDialog.getText(None, "Edit Label", "Enter new label:", text=original_text)
        if ok and new_text:
            # Allow each annotation's label to change independently.
            self.setPlainText(new_text)
            data = self.data(0)
            if data and isinstance(data, dict):
                data["annotation"]["label"] = new_text
        super().mouseDoubleClickEvent(event)

# ---------------- Custom GraphicsView for Zooming ----------------
class GraphicsViewWithWheel(QGraphicsView):
    """
    Customized QGraphicsView that supports zooming with the mouse wheel while holding Ctrl.
    """
    def wheelEvent(self, event):
        if QApplication.keyboardModifiers() == Qt.ControlModifier:
            if event.angleDelta().y() > 0:
                self.main_window.zoom_in()
            else:
                self.main_window.zoom_out()
            event.accept()
        else:
            super().wheelEvent(event)

# ---------------- Main Annotation Tool Class ----------------
class AnnotationTool(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Leaf Annotation Tool")

        # -------------- State Variables --------------
        self.image_folder = ""
        self.image_list = []
        self.current_image_index = -1
        self.image_info = {}  # { filename: {"width": w, "height": h} }
        # Annotations stored as: { filename: {"boxes": [], "polygons": [], "sam_masks": []} }
        self.annotations = {}
        self.drawing_mode = None  # 'box', 'polygon', or 'sam'
        # Temporary variables for drawing
        self.temp_box_item = None
        self.start_point = None
        self.temp_polygon = []
        self.temp_poly_item = None
        self.first_point_item = None  # Highlight first polygon point
        # Undo/Redo stacks
        self.undo_stack = []
        self.redo_stack = []
        # Mapping from class label to QColor
        self.class_colors = {}

        # -------------- Layout & UI Setup --------------
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        
        # Left side: Image list
        self.list_widget = QListWidget()
        self.list_widget.itemSelectionChanged.connect(self.on_image_selected)
        main_layout.addWidget(self.list_widget, 1)

        # Right side: Graphics view and control buttons
        right_layout = QVBoxLayout()
        main_layout.addLayout(right_layout, 4)

        # Graphics view and scene for displaying images and annotations
        self.graphics_view = GraphicsViewWithWheel()
        self.scene = QGraphicsScene()
        self.graphics_view.setScene(self.scene)
        right_layout.addWidget(self.graphics_view, stretch=1)
        self.graphics_view.viewport().installEventFilter(self)

        # Bottom buttons for different annotation modes and exporting
        button_layout = QHBoxLayout()
        right_layout.addLayout(button_layout)
        self.btn_box = QPushButton("Draw Box")
        self.btn_box.setIcon(QIcon("/home/idrone2/Downloads/box.png"))
        self.btn_box.clicked.connect(self.activate_box_mode)
        button_layout.addWidget(self.btn_box)
        self.btn_poly = QPushButton("Draw Polygon")
        self.btn_poly.setIcon(QIcon("/home/idrone2/Downloads/polygon.png"))
        self.btn_poly.clicked.connect(self.activate_polygon_mode)
        button_layout.addWidget(self.btn_poly)
        self.btn_sam = QPushButton("SAM")
        self.btn_sam.setIcon(QIcon("/home/idrone2/Downloads/sam.png"))
        self.btn_sam.clicked.connect(self.activate_sam_mode)
        button_layout.addWidget(self.btn_sam)
        self.btn_save = QPushButton("Export JSON (COCO)")
        self.btn_save.setIcon(QIcon("/home/idrone2/Downloads/export.png"))
        self.btn_save.clicked.connect(self.export_annotations_to_json)
        button_layout.addWidget(self.btn_save)

        # Top toolbar with actions: Open Folder, Undo, Redo, Zoom In, Zoom Out, Global Edit (optional)
        self.toolbar = QToolBar("Main Toolbar")
        self.addToolBar(Qt.TopToolBarArea, self.toolbar)
        open_folder_action = QAction(QIcon("/home/idrone2/Downloads/folder.png"), "Open Folder", self)
        open_folder_action.triggered.connect(self.open_folder)
        self.toolbar.addAction(open_folder_action)
        undo_action = QAction(QIcon("/home/idrone2/Downloads/undo.png"), "Undo", self)
        undo_action.triggered.connect(self.undo)
        self.toolbar.addAction(undo_action)
        redo_action = QAction(QIcon("/home/idrone2/Downloads/redo.png"), "Redo", self)
        redo_action.triggered.connect(self.redo)
        self.toolbar.addAction(redo_action)
        zoom_in_action = QAction(QIcon("/home/idrone2/Downloads/zoom_in.png"), "Zoom In", self)
        zoom_in_action.triggered.connect(self.zoom_in)
        self.toolbar.addAction(zoom_in_action)
        zoom_out_action = QAction(QIcon("/home/idrone2/Downloads/zoom_out.png"), "Zoom Out", self)
        zoom_out_action.triggered.connect(self.zoom_out)
        self.toolbar.addAction(zoom_out_action)
        # Optional: Global Edit Class Label action (updates all annotations on the current image)
        edit_label_action = QAction(QIcon("/home/idrone2/Downloads/edit.png"), "Edit All Labels", self)
        edit_label_action.triggered.connect(self.edit_class_label)
        self.toolbar.addAction(edit_label_action)

        # Allow the custom GraphicsView to call zoom methods
        self.graphics_view.main_window = self

    # -------------- Undo/Redo Mechanism --------------
    def push_state(self):
        """Save the current state to the undo stack."""
        state_copy = {
            "annotations": copy.deepcopy(self.annotations),
            "image_info": copy.deepcopy(self.image_info),
            "image_folder": self.image_folder,
            "image_list": list(self.image_list),
            "current_image_index": self.current_image_index
        }
        self.undo_stack.append(state_copy)
        self.redo_stack.clear()

    def restore_state(self, state):
        """Restore a previous state from the undo/redo stack."""
        self.annotations = copy.deepcopy(state["annotations"])
        self.image_info = copy.deepcopy(state["image_info"])
        self.image_folder = state["image_folder"]
        self.image_list = list(state["image_list"])
        self.current_image_index = state["current_image_index"]
        self.list_widget.clear()
        self.list_widget.addItems(self.image_list)
        if 0 <= self.current_image_index < len(self.image_list):
            filename = self.image_list[self.current_image_index]
            self.load_image(filename)
        else:
            self.scene.clear()

    def undo(self):
        """Undo the last action."""
        if not self.undo_stack:
            return
        current_state = {
            "annotations": copy.deepcopy(self.annotations),
            "image_info": copy.deepcopy(self.image_info),
            "image_folder": self.image_folder,
            "image_list": list(self.image_list),
            "current_image_index": self.current_image_index
        }
        self.redo_stack.append(current_state)
        prev_state = self.undo_stack.pop()
        self.restore_state(prev_state)

    def redo(self):
        """Redo the last undone action."""
        if not self.redo_stack:
            return
        current_state = {
            "annotations": copy.deepcopy(self.annotations),
            "image_info": copy.deepcopy(self.image_info),
            "image_folder": self.image_folder,
            "image_list": list(self.image_list),
            "current_image_index": self.current_image_index
        }
        self.undo_stack.append(current_state)
        next_state = self.redo_stack.pop()
        self.restore_state(next_state)

    # -------------- Utility Methods --------------
    def get_class_color(self, label):
        """
        Return a QColor for the given label.
        Generate a new random color if one is not already assigned.
        """
        if label not in self.class_colors:
            self.class_colors[label] = QColor(random.randint(0, 255),
                                              random.randint(0, 255),
                                              random.randint(0, 255))
        return self.class_colors[label]

    # -------------- Global Edit Class Label (Optional) --------------
    def edit_class_label(self):
        """
        Allow the user to update all annotation labels for the current image at once.
        This is optional since each annotation can be edited individually.
        """
        filename = self.get_current_filename()
        if not filename:
            QMessageBox.information(self, "Error", "No image selected.")
            return
        current_labels = [ann["label"] for ann_type in self.annotations[filename] 
                          for ann in self.annotations[filename][ann_type]]
        if not current_labels:
            QMessageBox.information(self, "No Labels", "No labels to edit for this image yet.")
            return
        new_label, ok = QInputDialog.getText(self, "Edit All Labels",
                                             f"Current labels: {current_labels}\nEnter new class label for all annotations:")
        if ok and new_label:
            try:
                # Update every annotation's label on the current image.
                for ann_type in ["boxes", "polygons", "sam_masks"]:
                    for ann in self.annotations[filename][ann_type]:
                        ann["label"] = new_label
                # Redraw the annotations.
                self.load_image(filename)
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to update labels: {str(e)}")

    # -------------- Image Loading and Display --------------
    def open_folder(self):
        """Open a folder dialog to select a folder containing images."""
        try:
            folder = QFileDialog.getExistingDirectory(self, "Select Folder with Images")
            if folder:
                self.push_state()
                self.image_folder = folder
                self.image_list = [f for f in os.listdir(folder)
                                   if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                self.image_list.sort()
                self.list_widget.clear()
                self.list_widget.addItems(self.image_list)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to open folder: {str(e)}")

    def on_image_selected(self):
        """Load the image when a new file is selected from the list."""
        items = self.list_widget.selectedItems()
        if not items:
            return
        selected_file = items[0].text()
        self.load_image(selected_file)

    def load_image(self, filename):
        """
        Load and display the image in the graphics scene.
        Also redraw any existing annotations for the image.
        """
        try:
            self.current_image_index = self.image_list.index(filename)
            img_path = os.path.join(self.image_folder, filename)
            bgr = cv2.imread(img_path)
            if bgr is None:
                QMessageBox.warning(self, "Error", f"Failed to load image: {img_path}")
                return
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb.shape
            bytes_per_line = ch * w
            qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)
            self.scene.clear()
            self.image_item = QGraphicsPixmapItem(QPixmap.fromImage(qimg))
            self.image_item.setOpacity(1.0)
            self.scene.addItem(self.image_item)
            self.graphics_view.fitInView(self.image_item, Qt.KeepAspectRatio)
            self.image_info[filename] = {"width": w, "height": h}
            if filename not in self.annotations:
                self.annotations[filename] = {"boxes": [], "polygons": [], "sam_masks": []}
            else:
                self.draw_existing_annotations(filename)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Error loading image: {str(e)}")

    def draw_existing_annotations(self, filename):
        """Redraw all stored annotations for the given image."""
        if filename not in self.annotations:
            self.annotations[filename] = {"boxes": [], "polygons": [], "sam_masks": []}
            return
        data = self.annotations[filename]
        for box_ann in data["boxes"]:
            self.draw_box(box_ann["box"], box_ann["label"], box_ann)
        for poly_ann in data["polygons"]:
            self.draw_polygon(poly_ann["polygon"], poly_ann["label"], poly_ann)
        for sam_ann in data["sam_masks"]:
            self.draw_sam_mask(sam_ann["mask"], sam_ann["label"], sam_ann)

    def get_current_filename(self):
        """Return the filename of the currently selected image."""
        if 0 <= self.current_image_index < len(self.image_list):
            return self.image_list[self.current_image_index]
        return None

    # -------------- Mode Selection and Temporary Drawing --------------
    def activate_box_mode(self):
        """Activate the box drawing mode."""
        self.drawing_mode = 'box'
        self.clear_temp_drawings()
        print("Box mode activated.")

    def activate_polygon_mode(self):
        """Activate the polygon drawing mode."""
        self.drawing_mode = 'polygon'
        self.clear_temp_drawings()
        print("Polygon mode activated. Click to add points; click near the first point or right-click to finish.")

    def activate_sam_mode(self):
        """Activate SAM segmentation mode."""
        self.drawing_mode = 'sam'
        self.clear_temp_drawings()
        print("SAM mode activated. Click on an object to segment.")

    def clear_temp_drawings(self):
        """Clear any temporary drawing items."""
        self.start_point = None
        if self.temp_box_item:
            self.scene.removeItem(self.temp_box_item)
            self.temp_box_item = None
        self.temp_polygon = []
        if self.temp_poly_item:
            self.scene.removeItem(self.temp_poly_item)
            self.temp_poly_item = None
        if self.first_point_item:
            self.scene.removeItem(self.first_point_item)
            self.first_point_item = None

    # -------------- Zoom Functions --------------
    def zoom_in(self):
        """Zoom in the view."""
        self.graphics_view.scale(1.25, 1.25)

    def zoom_out(self):
        """Zoom out the view."""
        self.graphics_view.scale(0.8, 0.8)

    # -------------- Mouse Event Handling --------------
    def eventFilter(self, source, event):
        """Handle mouse events in the graphics view for drawing and status updates."""
        if source == self.graphics_view.viewport():
            if event.type() == QEvent.MouseMove:
                pos = self.graphics_view.mapToScene(event.pos())
                self.statusBar().showMessage(f"Mouse: X={int(pos.x())}, Y={int(pos.y())}")
            if event.type() == QEvent.MouseButtonPress:
                self.handle_mouse_press(event)
                return True
            elif event.type() == QEvent.MouseMove:
                self.handle_mouse_move(event)
                return True
            elif event.type() == QEvent.MouseButtonRelease:
                self.handle_mouse_release(event)
                return True
        return super().eventFilter(source, event)

    def handle_mouse_press(self, event):
        """Handle mouse press events based on the current drawing mode."""
        if not hasattr(self, 'image_item') or self.image_item is None:
            return

        pos = self.graphics_view.mapToScene(event.pos())
        if self.drawing_mode == 'box':
            self.start_point = pos
            if not self.temp_box_item:
                self.temp_box_item = self.scene.addRect(0, 0, 0, 0, QPen(Qt.red, 6))
        elif self.drawing_mode == 'polygon':
            # Check if the user is closing the polygon by clicking near the first point.
            if len(self.temp_polygon) >= 3:
                dist = self._distance(pos, self.temp_polygon[0])
                if dist < 10:
                    self._finalize_polygon()
                    return
            self.temp_polygon.append(pos)
            self.update_temp_polygon_item()
        elif self.drawing_mode == 'sam':
            self.run_sam_at_point(pos)

    def handle_mouse_move(self, event):
        """Update temporary shapes while the mouse is moving."""
        if not hasattr(self, 'image_item') or self.image_item is None:
            return
        if self.drawing_mode == 'box' and self.start_point and self.temp_box_item:
            current_pos = self.graphics_view.mapToScene(event.pos())
            x1, y1 = self.start_point.x(), self.start_point.y()
            x2, y2 = current_pos.x(), current_pos.y()
            rect_x, rect_y = min(x1, x2), min(y1, y2)
            rect_w, rect_h = abs(x2 - x1), abs(y2 - y1)
            self.temp_box_item.setRect(rect_x, rect_y, rect_w, rect_h)

    def handle_mouse_release(self, event):
        """Finalize drawing when the mouse button is released."""
        if not hasattr(self, 'image_item') or self.image_item is None:
            return
        if self.drawing_mode == 'box' and self.start_point and self.temp_box_item:
            current_pos = self.graphics_view.mapToScene(event.pos())
            x1, y1 = self.start_point.x(), self.start_point.y()
            x2, y2 = current_pos.x(), current_pos.y()
            box_coords = [int(min(x1, x2)), int(min(y1, y2)), int(max(x1, x2)), int(max(y1, y2))]
            self.start_point = None
            self.scene.removeItem(self.temp_box_item)
            self.temp_box_item = None
            label, ok = QInputDialog.getText(self, "Label", "Enter label for bounding box:")
            if ok and label:
                self.push_state()
                filename = self.get_current_filename()
                ann_record = {"label": label, "box": box_coords, "image": filename}
                self.annotations[filename]["boxes"].append(ann_record)
                self.draw_box(box_coords, label, ann_record)
        if self.drawing_mode == 'polygon':
            # Finalize polygon on right-click if enough points exist.
            if event.button() == Qt.RightButton and len(self.temp_polygon) > 2:
                self._finalize_polygon()

    def _finalize_polygon(self):
        """Complete the polygon annotation by prompting for a label and drawing it."""
        label, ok = QInputDialog.getText(self, "Label", "Enter label for polygon:")
        if ok and label:
            self.push_state()
            filename = self.get_current_filename()
            poly = [(int(p.x()), int(p.y())) for p in self.temp_polygon]
            ann_record = {"label": label, "polygon": poly, "image": filename}
            self.annotations[filename]["polygons"].append(ann_record)
            self.draw_polygon(poly, label, ann_record)
        self.clear_temp_drawings()

    def update_temp_polygon_item(self):
        """Update the temporary polygon drawing as the user adds points."""
        if self.temp_poly_item is None:
            self.temp_poly_item = QGraphicsPathItem()
            pen = QPen(Qt.red, 8, Qt.DashLine)
            self.temp_poly_item.setPen(pen)
            self.scene.addItem(self.temp_poly_item)
        path = QPainterPath()
        if self.temp_polygon:
            path.moveTo(self.temp_polygon[0])
            for p in self.temp_polygon[1:]:
                path.lineTo(p)
        self.temp_poly_item.setPath(path)
        if self.temp_polygon:
            if self.first_point_item is None:
                self.first_point_item = self.scene.addEllipse(0, 0, 24, 24, QPen(Qt.yellow, 4), QBrush(Qt.yellow))
            first = self.temp_polygon[0]
            self.first_point_item.setRect(first.x()-12, first.y()-12, 24, 24)

    def _distance(self, p1, p2):
        """Calculate Euclidean distance between two QPointF objects."""
        return ((p1.x() - p2.x())**2 + (p1.y() - p2.y())**2)**0.5

    # -------------- Drawing Functions --------------
    def draw_box(self, box_coords, label, annotation_record):
        """Draw a bounding box and its label on the scene."""
        color = self.get_class_color(label)
        x1, y1, x2, y2 = box_coords
        pen = QPen(color, 6)
        self.scene.addRect(QRectF(x1, y1, x2 - x1, y2 - y1), pen)
        text_item = EditableTextItem(label, parent_tool=self, image_filename=self.get_current_filename())
        text_item.setDefaultTextColor(color)
        font = QFont()
        font.setPointSize(20)
        text_item.setFont(font)
        text_item.setPos(x1, y1)
        self.scene.addItem(text_item)
        text_item.setData(0, {"annotation": annotation_record})

    def draw_polygon(self, polygon_points, label, annotation_record):
        """Draw a polygon and its label on the scene."""
        color = self.get_class_color(label)
        pen = QPen(color, 8)
        brush = QBrush(color)
        brush.setStyle(Qt.Dense4Pattern)
        qpoly = QPolygonF()
        for (x, y) in polygon_points:
            qpoly.append(QPointF(x, y))
        poly_item = self.scene.addPolygon(qpoly, pen, brush)
        poly_item.setOpacity(0.7)
        text_item = EditableTextItem(label, parent_tool=self, image_filename=self.get_current_filename())
        text_item.setDefaultTextColor(color)
        font = QFont()
        font.setPointSize(20)
        text_item.setFont(font)
        text_item.setPos(polygon_points[0][0], polygon_points[0][1])
        self.scene.addItem(text_item)
        text_item.setData(0, {"annotation": annotation_record})
        for (x, y) in polygon_points:
            ellipse = self.scene.addEllipse(x-8, y-8, 16, 16, pen, brush)
            ellipse.setOpacity(0.8)

    def draw_sam_mask(self, mask_data, label, annotation_record):
        """Draw the SAM segmentation mask and its label on the scene."""
        mask_np = np.array(mask_data, dtype=np.uint8)
        color = self.get_class_color(label)
        contours, _ = cv2.findContours(mask_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            if len(cnt) < 3:
                continue
            qpoly = QPolygonF()
            for c in cnt:
                x, y = c[0]
                qpoly.append(QPointF(x, y))
            pen = QPen(color, 6)
            brush = QBrush(color)
            brush.setStyle(Qt.SolidPattern)
            poly_item = self.scene.addPolygon(qpoly, pen, brush)
            poly_item.setOpacity(0.4)
        ys, xs = np.where(mask_np > 0)
        if len(xs) == 0 or len(ys) == 0:
            return
        x_min, y_min = int(np.min(xs)), int(np.min(ys))
        text_item = EditableTextItem(label, parent_tool=self, image_filename=self.get_current_filename())
        text_item.setDefaultTextColor(color)
        font = QFont()
        font.setPointSize(20)
        text_item.setFont(font)
        text_item.setPos(x_min, y_min)
        self.scene.addItem(text_item)
        text_item.setData(0, {"annotation": annotation_record})

    # -------------- SAM Segmentation --------------
    def run_sam_at_point(self, pos):
        """
        Run SAM segmentation at the clicked point.
        Load the image, run the SAM model, and select the mask that covers the clicked pixel.
        """
        QApplication.setOverrideCursor(Qt.WaitCursor)
        self.statusBar().showMessage("Processing SAM segmentation...", 3000)
        try:
            filename = self.get_current_filename()
            if not filename:
                return
            x, y = int(pos.x()), int(pos.y())
            img_path = os.path.join(self.image_folder, filename)
            bgr = cv2.imread(img_path)
            if bgr is None:
                QMessageBox.warning(self, "Error", f"Failed to load image for SAM segmentation: {img_path}")
                return
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            sam_model = SAM("sam_b.pt")
            results = sam_model(rgb)
            chosen_mask = None
            # Iterate over SAM results to find a mask that contains the clicked point.
            for result in results:
                mask_array = result.masks.data.cpu().numpy()
                for mask in mask_array:
                    mask_bin = (mask > 0.5).astype(np.uint8)
                    if y < mask_bin.shape[0] and x < mask_bin.shape[1] and mask_bin[y, x] == 1:
                        chosen_mask = mask_bin
                        break
                if chosen_mask is not None:
                    break
            if chosen_mask is None:
                QMessageBox.information(self, "No Mask", "No mask found at clicked point.")
                return
            label, ok = QInputDialog.getText(self, "Label", "Enter label for SAM segmentation:")
            if ok and label:
                self.push_state()
                filename = self.get_current_filename()
                ann_record = {"label": label, "mask": chosen_mask.tolist(), "image": filename}
                self.annotations[filename]["sam_masks"].append(ann_record)
                self.draw_sam_mask(chosen_mask.tolist(), label, ann_record)
        except Exception as e:
            QMessageBox.critical(self, "SAM Error", f"Error during SAM segmentation: {str(e)}")
        finally:
            QApplication.restoreOverrideCursor()
            self.drawing_mode = None

    # -------------- Export Annotations and Reset --------------
    def export_annotations_to_json(self):
        """Export all annotations to a JSON file in COCO format."""
        if not self.image_list:
            return
        self.push_state()
        coco = {
            "images": [],
            "annotations": [],
            "categories": []
        }
        category_mapping = {}
        ann_id = 1
        try:
            for img_idx, filename in enumerate(self.image_list):
                if filename not in self.image_info:
                    continue
                w = self.image_info[filename]["width"]
                h = self.image_info[filename]["height"]
                image_entry = {
                    "id": img_idx + 1,
                    "file_name": filename,
                    "width": w,
                    "height": h
                }
                coco["images"].append(image_entry)
                image_id = image_entry["id"]
                if filename not in self.annotations:
                    continue
                ann_data = self.annotations[filename]
                # Process bounding box annotations.
                for box_ann in ann_data["boxes"]:
                    label = box_ann["label"]
                    if label not in category_mapping:
                        category_mapping[label] = len(category_mapping) + 1
                    x1, y1, x2, y2 = box_ann["box"]
                    bbox = [x1, y1, x2 - x1, y2 - y1]
                    area = (x2 - x1) * (y2 - y1)
                    coco["annotations"].append({
                        "id": ann_id,
                        "image_id": image_id,
                        "category_id": category_mapping[label],
                        "bbox": bbox,
                        "segmentation": [],
                        "area": area,
                        "iscrowd": 0
                    })
                    ann_id += 1
                # Process polygon annotations.
                for poly_ann in ann_data["polygons"]:
                    label = poly_ann["label"]
                    if label not in category_mapping:
                        category_mapping[label] = len(category_mapping) + 1
                    poly = poly_ann["polygon"]
                    segmentation = [sum(poly, ())]
                    xs = [p[0] for p in poly]
                    ys = [p[1] for p in poly]
                    x_min, y_min, x_max, y_max = min(xs), min(ys), max(xs), max(ys)
                    bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
                    area = cv2.contourArea(np.array(poly, dtype=np.int32))
                    coco["annotations"].append({
                        "id": ann_id,
                        "image_id": image_id,
                        "category_id": category_mapping[label],
                        "bbox": bbox,
                        "segmentation": [list(map(int, segmentation[0]))],
                        "area": float(area),
                        "iscrowd": 0
                    })
                    ann_id += 1
                # Process SAM mask annotations.
                for sam_ann in ann_data["sam_masks"]:
                    label = sam_ann["label"]
                    if label not in category_mapping:
                        category_mapping[label] = len(category_mapping) + 1
                    mask = np.array(sam_ann["mask"], dtype=np.uint8)
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    segmentation = []
                    for cnt in contours:
                        cnt = cnt.flatten().tolist()
                        if len(cnt) >= 6:
                            segmentation.append(list(map(int, cnt)))
                    if segmentation:
                        all_points = np.concatenate([np.array(seg).reshape(-1, 2) for seg in segmentation], axis=0)
                        x_min, y_min = int(np.min(all_points[:, 0])), int(np.min(all_points[:, 1]))
                        x_max, y_max = int(np.max(all_points[:, 0])), int(np.max(all_points[:, 1]))
                        bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
                    else:
                        bbox = [0, 0, 0, 0]
                    area = int(np.sum(mask))
                    coco["annotations"].append({
                        "id": ann_id,
                        "image_id": image_id,
                        "category_id": category_mapping[label],
                        "bbox": bbox,
                        "segmentation": segmentation,
                        "area": area,
                        "iscrowd": 0
                    })
                    ann_id += 1
            for label, cat_id in category_mapping.items():
                coco["categories"].append({"id": cat_id, "name": label})
            out_path, _ = QFileDialog.getSaveFileName(self, "Save Annotations", "", "JSON Files (*.json)")
            if not out_path:
                return
            with open(out_path, "w") as f:
                json.dump(coco, f, indent=2)
            print(f"Annotations saved to {out_path}")
            self.reset_app()
        except Exception as e:
            QMessageBox.critical(self, "Export Error", f"Failed to export annotations: {str(e)}")

    def reset_app(self):
        """Reset the application state."""
        self.push_state()
        self.annotations.clear()
        self.image_folder = ""
        self.image_list.clear()
        self.current_image_index = -1
        self.image_info.clear()
        self.list_widget.clear()
        self.scene.clear()
        self.drawing_mode = None
        self.clear_temp_drawings()

# -------------- Main Function --------------
def main():
    try:
        app = QApplication(sys.argv)
        win = AnnotationTool()
        win.show()
        sys.exit(app.exec_())
    except Exception as e:
        print(f"Application Error: {str(e)}")

if __name__ == "__main__":
    main()
