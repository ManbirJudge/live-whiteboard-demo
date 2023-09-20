import random
from typing import List, Tuple, Dict

import cv2
import numpy as np
from matplotlib import pyplot as plt
from cmocean import cm

PYPLOT_CMAPS = [
    'Accent', 'Accent_r', 'Blues', 'Blues_r', 'BrBG', 'BrBG_r', 'BuGn', 'BuGn_r', 'BuPu', 'BuPu_r',
    'CMRmap', 'CMRmap_r', 'Dark2', 'Dark2_r', 'GnBu', 'GnBu_r', 'Greens', 'Greens_r', 'Greys', 'Greys_r',
    'OrRd', 'OrRd_r', 'Oranges', 'Oranges_r', 'PRGn', 'PRGn_r', 'Paired', 'Paired_r', 'Pastel1',
    'Pastel1_r', 'Pastel2', 'Pastel2_r', 'PiYG', 'PiYG_r', 'PuBu', 'PuBuGn', 'PuBuGn_r', 'PuBu_r', 'PuOr',
    'PuOr_r', 'PuRd', 'PuRd_r', 'Purples', 'Purples_r', 'RdBu', 'RdBu_r', 'RdGy', 'RdGy_r', 'RdPu',
    'RdPu_r', 'RdYlBu', 'RdYlBu_r', 'RdYlGn', 'RdYlGn_r', 'Reds', 'Reds_r', 'Set1', 'Set1_r', 'Set2',
    'Set2_r', 'Set3', 'Set3_r', 'Spectral', 'Spectral_r', 'Wistia', 'Wistia_r', 'YlGn', 'YlGnBu',
    'YlGnBu_r', 'YlGn_r', 'YlOrBr', 'YlOrBr_r', 'YlOrRd', 'YlOrRd_r', 'afmhot', 'afmhot_r', 'autumn',
    'autumn_r', 'binary', 'binary_r', 'bone', 'bone_r', 'brg', 'brg_r', 'bwr', 'bwr_r', 'cividis',
    'cividis_r', 'cool', 'cool_r', 'coolwarm', 'coolwarm_r', 'copper', 'copper_r', 'cubehelix',
    'cubehelix_r', 'flag', 'flag_r', 'gist_earth', 'gist_earth_r', 'gist_gray', 'gist_gray_r', 'gist_heat',
    'gist_heat_r', 'gist_ncar', 'gist_ncar_r', 'gist_rainbow', 'gist_rainbow_r', 'gist_stern',
    'gist_stern_r', 'gist_yarg', 'gist_yarg_r', 'gnuplot', 'gnuplot2', 'gnuplot2_r', 'gnuplot_r', 'gray',
    'gray_r', 'hot', 'hot_r', 'hsv', 'hsv_r', 'inferno', 'inferno_r', 'jet', 'jet_r', 'magma', 'magma_r',
    'nipy_spectral', 'nipy_spectral_r', 'ocean', 'ocean_r', 'pink', 'pink_r', 'plasma', 'plasma_r', 'prism',
    'prism_r', 'rainbow', 'rainbow_r', 'seismic', 'seismic_r', 'spring', 'spring_r', 'summer', 'summer_r',
    'tab10', 'tab10_r', 'tab20', 'tab20_r', 'tab20b', 'tab20b_r', 'tab20c', 'tab20c_r', 'terrain',
    'terrain_r', 'turbo', 'turbo_r', 'twilight', 'twilight_r', 'twilight_shifted', 'twilight_shifted_r',
    'viridis', 'viridis_r', 'winter', 'winter_r'
]
CMOCEAN_CMAPS = [getattr(cm, cmap_name) for cmap_name in cm.cmapnames]


class Point:
    x: int
    y: int

    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y

    def to_py(self) -> Tuple[int, int]:
        return self.x, self.y


class Stroke:
    def __init__(
            self,
            points: List[Point] | None = None,
            tuple_points: List[Tuple[int, int]] | None = None,
            dict_points: List[Dict[str, int]] | None = None
    ) -> None:
        self.points: List[Point] = []

        if points is not None:
            self.points = points
        elif tuple_points is not None:
            self.points = [Point(round(point[0]), round(point[1])) for point in tuple_points]
        elif dict_points is not None:
            self.points = [Point(round(point['x']), round(point['y'])) for point in dict_points]

    def __len__(self):
        return len(self.points)

    def __str__(self) -> str:
        return str(self.to_py())

    def to_py(self) -> List[Tuple[int, int]]:
        return [point.to_py() for point in self.points]

    def to_matplotlib(self) -> Tuple[List[int], List[int]]:
        return (
            [point.x for point in self.points],
            [point.y for point in self.points],
        )

    def plot(self):
        x, y = self.to_matplotlib()
        plt.plot(x, y)

    def draw_cv(self, img: cv2.UMat | np.ndarray, color: Tuple[int, int, int] = (0, 0, 0)) -> cv2.UMat | np.ndarray:
        for i, point in enumerate(self.points):
            if i == len(self.points) - 1:
                continue

            cv2.line(
                img=img,
                pt1=point.to_py(),
                pt2=self.points[i + 1].to_py(),
                color=color,
                thickness=2,
                lineType=cv2.LINE_4
            )

    def save(self, title: str):
        self.plot()
        plt.savefig(title)
        plt.clf()


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return '#%02x%02x%02x' % rgb


def rand_color() -> Tuple[int, int, int]:
    return random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)


def rand_color_hex() -> str:
    return rgb_to_hex(rand_color())


def abstract_line(slope, intercept):
    axes = plt.gca()

    x_vals = np.array(axes.get_xlim())
    y_vals = intercept + slope * x_vals

    plt.plot(x_vals, y_vals, '--')


def linspace(start, stop, num=50, endpoint=True):
    num = int(num)

    start = start * 1.
    stop = stop * 1.

    if num == 1:
        yield stop
        return
    if endpoint:
        step = (stop - start) / (num - 1)
    else:
        step = (stop - start) / num

    for i in range(num):
        yield start + step * i
