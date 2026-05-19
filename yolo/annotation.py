import sys
import os
import cv2
import json
import torch
import numpy as np

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QFileDialog, QLabel, QListWidget, QGraphicsView,
    QGraphicsScene, QGraphicsPixmapItem, QMenuBar, QAction
)
from PyQt5.QtGui import QPixmap, QImage, QPainter, QPen, QColor
from PyQt5.QtCore import Qt, QRectF, QPoint

# If using the official segment-anything library:
# from segment_anything import sam_model_registry, SamPredictor
# If using Ultralytics:
from ultralytics import SAM

class AnnotationTool(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Leaf Annotation Tool (Demo)")

        # -------------- State Variables --------------
        self.image_folder = ""
        self.image_list = []
        self.current_image_index = -1

        # For storing annotations in memory:
        # { filename: {"boxes": [...], "polygons": [...], "sam_masks": [...]} }
        self.annotations = {}

        # Drawing states
        self.drawing_mode = None  # 'box', 'polygon', or None
        self.temp_polygon = []
        self.temp_boxes = []
        self.start_point = None
        self.end_point = None

        # -------------- Layout/UI --------------
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QHBoxLayout(central_widget)
        
        # Left side: list of images
        self.list_widget = QListWidget()
        self.list_widget.itemSelectionChanged.connect(self.on_image_selected)
        main_layout.addWidget(self.list_widget, 1)

        # Right side: image display + buttons
        right_layout = QVBoxLayout()
        main_layout.addLayout(right_layout, 4)

        # GraphicsView/Scene to show image
        self.graphics_view = QGraphicsView()
        self.scene = QGraphicsScene()
        self.graphics_view.setScene(self.scene)
        right_layout.addWidget(self.graphics_view, stretch=1)

        # Buttons
        button_layout = QHBoxLayout()
        right_layout.addLayout(button_layout)

        self.btn_box = QPushButton("Draw Box")
        self.btn_box.clicked.connect(self.activate_box_mode)
        button_layout.addWidget(self.btn_box)

        self.btn_poly = QPushButton("Draw Polygon")
        self.btn_poly.clicked.connect(self.activate_polygon_mode)
        button_layout.addWidget(self.btn_poly)

        self.btn_sam = QPushButton("Auto SAM")
        self.btn_sam.clicked.connect(self.run_sam_on_current_image)
        button_layout.addWidget(self.btn_sam)

        self.btn_save = QPushButton("Export JSON")
        self.btn_save.clicked.connect(self.export_annotations_to_json)
        button_layout.addWidget(self.btn_save)

        # -------------- Menu Bar --------------
        menubar = self.menuBar()
        file_menu = menubar.addMenu("File")

        open_action = QAction("Open Folder", self)
        open_action.triggered.connect(self.open_folder)
        file_menu.addAction(open_action)

        # For CRUD, we assume:
        #  - Create = user draws new shapes
        #  - Read = load from JSON
        #  - Update = user modifies shapes (not fully implemented)
        #  - Delete = remove shape (not fully implemented)
        # You can expand the UI to handle shape updates/deletions easily.

    def open_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select Folder with Images")
        if folder:
            self.image_folder = folder
            self.image_list = [f for f in os.listdir(folder)
                               if f.lower().endswith(('.jpg','.jpeg','.png'))]
            self.image_list.sort()
            self.list_widget.clear()
            self.list_widget.addItems(self.image_list)

    def on_image_selected(self):
        items = self.list_widget.selectedItems()
        if not items:
            return
        selected_file = items[0].text()
        self.load_image(selected_file)

    def load_image(self, filename):
        """Load and display the specified image."""
        self.current_image_index = self.image_list.index(filename)
        img_path = os.path.join(self.image_folder, filename)
        bgr = cv2.imread(img_path)
        if bgr is None:
            return

        # Convert to QImage
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb.shape
        bytes_per_line = ch * w
        qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)

        # Clear scene & show new image
        self.scene.clear()
        pix = QPixmap.fromImage(qimg)
        self.image_item = QGraphicsPixmapItem(pix)
        self.scene.addItem(self.image_item)
        self.graphics_view.fitInView(self.image_item, Qt.KeepAspectRatio)

        # Load existing annotations if any
        if filename not in self.annotations:
            self.annotations[filename] = {"boxes": [], "polygons": [], "sam_masks": []}
        else:
            # Here you could re-draw existing boxes/polygons
            self.draw_existing_annotations(filename)

    def draw_existing_annotations(self, filename):
        # Re-draw bounding boxes or polygons on the scene
        data = self.annotations[filename]
        for box in data["boxes"]:
            self.draw_box(box)
        for poly in data["polygons"]:
            self.draw_polygon(poly)

    # -------------------- Drawing Logic --------------------
    def activate_box_mode(self):
        self.drawing_mode = 'box'

    def activate_polygon_mode(self):
        self.drawing_mode = 'polygon'
        self.temp_polygon = []

    def mousePressEvent(self, event):
        """Handle mouse down for drawing on the QGraphicsView."""
        if not self.image_item:
            return
        if self.drawing_mode is None:
            return

        # Map from global to scene coords
        pos = self.graphics_view.mapToScene(event.pos())
        if self.drawing_mode == 'box':
            self.start_point = pos
        elif self.drawing_mode == 'polygon':
            self.temp_polygon.append(pos)

    def mouseReleaseEvent(self, event):
        """Handle mouse up for drawing on the QGraphicsView."""
        if not self.image_item:
            return
        if self.drawing_mode == 'box' and self.start_point:
            pos = self.graphics_view.mapToScene(event.pos())
            self.end_point = pos

            # Build the rectangle
            x1, y1 = self.start_point.x(), self.start_point.y()
            x2, y2 = self.end_point.x(), self.end_point.y()
            box = [int(x1), int(y1), int(x2), int(y2)]
            self.annotations[self.image_list[self.current_image_index]]["boxes"].append(box)

            self.draw_box(box)
            self.start_point = None
            self.end_point = None

        elif self.drawing_mode == 'polygon':
            # If user right-clicks or double-click to finalize
            if event.button() == Qt.RightButton:
                # finalize polygon
                poly = [(int(p.x()), int(p.y())) for p in self.temp_polygon]
                self.annotations[self.image_list[self.current_image_index]]["polygons"].append(poly)
                self.draw_polygon(poly)
                self.temp_polygon = []

    def paintEvent(self, event):
        """If you want to draw lines for the partial polygon in real-time."""
        super().paintEvent(event)
        if self.drawing_mode == 'polygon' and len(self.temp_polygon) > 1:
            painter = QPainter(self)
            pen = QPen(Qt.red, 2)
            painter.setPen(pen)
            for i in range(len(self.temp_polygon) - 1):
                p1 = self.graphics_view.mapToGlobal(self.graphics_view.mapFromScene(self.temp_polygon[i]))
                p2 = self.graphics_view.mapToGlobal(self.graphics_view.mapFromScene(self.temp_polygon[i+1]))
                painter.drawLine(p1, p2)

    def draw_box(self, box):
        """Draw a rectangular annotation on the scene."""
        x1, y1, x2, y2 = box
        rect = QRectF(x1, y1, x2 - x1, y2 - y1)
        pen = QPen(Qt.green, 2)
        self.scene.addRect(rect, pen)

    def draw_polygon(self, polygon_points):
        """Draw a polygon annotation on the scene."""
        if len(polygon_points) < 2:
            return
        pen = QPen(Qt.blue, 2)
        for i in range(len(polygon_points) - 1):
            x1, y1 = polygon_points[i]
            x2, y2 = polygon_points[i+1]
            self.scene.addLine(x1, y1, x2, y2, pen)
        # close the polygon
        x1, y1 = polygon_points[-1]
        x2, y2 = polygon_points[0]
        self.scene.addLine(x1, y1, x2, y2, pen)

    # -------------------- SAM Logic --------------------
    def run_sam_on_current_image(self):
        """Auto-annotate with SAM, store masks in annotations."""
        if self.current_image_index < 0:
            return
        filename = self.image_list[self.current_image_index]
        img_path = os.path.join(self.image_folder, filename)
        bgr = cv2.imread(img_path)
        if bgr is None:
            return

        # Convert BGR->RGB for SAM
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

        # 1) Use Ultralytics approach:
        sam_model = SAM("sam_b.pt")
        results = sam_model(rgb)

        # 2) Store the resulting masks
        masks_data = []
        for result in results:
            # result.masks.data => shape [N, H, W]
            mask_array = result.masks.data.cpu().numpy()
            for mask in mask_array:
                # Convert to 0/1
                mask_bin = (mask > 0.5).astype(np.uint8)
                # (Optional) you can store directly or convert to polygon
                masks_data.append(mask_bin.tolist())  # store as list-of-lists

        self.annotations[filename]["sam_masks"] = masks_data
        print(f"SAM auto-annotations stored for {filename}")

    # -------------------- Exporting to JSON --------------------
    def export_annotations_to_json(self):
        out_path, _ = QFileDialog.getSaveFileName(self, "Save Annotations", "", "JSON Files (*.json)")
        if not out_path:
            return
        with open(out_path, "w") as f:
            json.dump(self.annotations, f, indent=2)
        print(f"Annotations saved to {out_path}")

def main():
    app = QApplication(sys.argv)
    win = AnnotationTool()
    win.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
