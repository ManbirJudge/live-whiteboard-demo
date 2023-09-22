import math
from typing import List

from Utils import linspace


def hough_py(
        img: List[List[int]],
        thetas: List[int] = None,
        quantize: bool = False,
        k_size: int = 1,
        decrease_f: int = 1
) -> (List[int], List[int], List[List[int]]):
    rho_max = int(math.ceil(math.sqrt(len(img) ** 2 + len(img[0]) ** 2)))

    if thetas is None:
        thetas = list(linspace(
            start=-math.pi / 2,
            stop=math.pi / 2,
            num=360,
            endpoint=False
        ))

    rhos = range(-rho_max, rho_max, 1)
    accumulator = [[0 for _ in range(len(thetas))] for __ in range(rho_max * 2)]
    acc_shape = (rho_max * 2, len(thetas))

    for y, row in enumerate(img):
        for x, col in enumerate(row):
            if col == 0:
                continue

            for i, theta in enumerate(thetas):
                rho = int(round(x * math.cos(theta) + y * math.sin(theta)))

                accumulator[rho + rho_max][i] += 1

                if quantize:
                    for kr in range(-k_size, k_size + 1):
                        for ki in range(-k_size, k_size + 1):
                            new_rho = rho + rho_max + kr
                            new_i = i + ki
                            if 0 <= new_rho < acc_shape[0] and 0 <= new_i < acc_shape[1]:
                                accumulator[new_rho][new_i] += 1 * decrease_f

    return thetas, rhos, accumulator
