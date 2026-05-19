# rfblite.py
import torch
import torch.nn as nn

class DWConv(nn.Module):
    def __init__(self, c1, c2, k=3, s=1, p=None):
        super().__init__()
        p = k // 2 if p is None else p
        self.conv = nn.Sequential(
            nn.Conv2d(c1, c1, k, s, p, groups=c1, bias=False),
            nn.BatchNorm2d(c1),
            nn.SiLU(),
            nn.Conv2d(c1, c2, 1, 1, 0, bias=False),
            nn.BatchNorm2d(c2),
            nn.SiLU()
        )
    def forward(self, x): return self.conv(x)

class RFBlite(nn.Module):
    """Tiny Receptive Field Block (three parallel dilations, depthwise)"""
    def __init__(self, c, r=0.5, dilations=(1, 3, 5)):
        super().__init__()
        mid = int(c * r)
        self.branches = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(c, mid, 1, 1, 0, bias=False),
                nn.BatchNorm2d(mid), nn.SiLU(),
                nn.Conv2d(mid, mid, 3, 1, d, padding=d, groups=mid, bias=False),
                nn.BatchNorm2d(mid), nn.SiLU(),
                nn.Conv2d(mid, c, 1, 1, 0, bias=False),
                nn.BatchNorm2d(c), nn.SiLU()
            ) for d in dilations
        ])
        self.fuse = DWConv(c * (len(dilations)+1), c, 3, 1)

    def forward(self, x):
        outs = [x] + [b(x) for b in self.branches]
        return self.fuse(torch.cat(outs, 1))

