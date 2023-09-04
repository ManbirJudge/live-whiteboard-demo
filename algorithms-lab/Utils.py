import random
from typing import List, Tuple, Dict

import cv2
import numpy as np
from matplotlib import pyplot as plt


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

    def draw_cv(self, img: cv2.UMat | np.ndarray) -> cv2.UMat | np.ndarray:
        for i, point in enumerate(self.points):
            if i == len(self.points) - 1:
                continue

            cv2.line(
                img=img,
                pt1=point.to_py(),
                pt2=self.points[i + 1].to_py(),
                color=(0, 0, 255),
                thickness=1,
                lineType=cv2.LINE_AA
            )

            print(point.to_py(), self.points[i + 1].to_py())

    def save(self, title: str):
        self.plot()
        plt.savefig(title)
        plt.clf()


def rand_color() -> Tuple[int, int, int]:
    return random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)