# imports
import json
import math
import random
from typing import Tuple, List

import cv2
import numpy as np
import scipy.ndimage as ndi
from matplotlib import pyplot as plt
from numba import jit
from skimage import measure

from Utils import Stroke, linspace, rand_color_hex, Point, CMOCEAN_CMAPS, PYPLOT_CMAPS


# functions
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


def hough_np(
        img: np.ndarray | cv2.UMat,
        thetas: np.ndarray = None,
        quantize: bool = False,
        k_size: int = 1,
        decrease_f: int = 1
) -> (np.ndarray, np.ndarray, np.ndarray):
    rho_max = int(np.ceil(np.sqrt(len(img) ** 2 + len(img[0]) ** 2)))

    if thetas is None:
        thetas = np.linspace(
            start=-np.pi / 2,
            stop=np.pi / 2,
            num=360,
            endpoint=False
        )
    rhos = np.arange(-rho_max, rho_max, 1)
    accumulator = np.zeros(shape=(rho_max * 2, thetas.size), dtype=np.uint8)

    for y, row in enumerate(img):
        for x, col in enumerate(row):
            if col == 0:
                continue

            for i, theta in enumerate(thetas):
                rho = int(np.round(x * np.cos(theta) + y * np.sin(theta)))

                accumulator[rho + rho_max][i] += 1

                if quantize:
                    for kr in range(-k_size, k_size + 1):
                        for ki in range(-k_size, k_size + 1):
                            new_rho = rho + rho_max + kr
                            new_i = i + ki

                            if 0 <= new_rho < accumulator.shape[0] and 0 <= new_i < accumulator.shape[1]:
                                accumulator[new_rho][new_i] += 1 * decrease_f

    return thetas, rhos, accumulator


@jit(nopython=True)
def hough_numba(
        img: np.ndarray | cv2.UMat,
        thetas: np.ndarray = None,
        quantize: bool = False,
        k_size: int = 1,
        decrease_f: int = 1
) -> (np.ndarray, np.ndarray, np.ndarray):
    rho_max = int(np.ceil(np.sqrt(len(img) ** 2 + len(img[0]) ** 2)))

    if thetas is None:
        thetas = np.linspace(
            start=-np.pi / 2,
            stop=np.pi / 2,
            num=360
        )
    rhos = np.arange(-rho_max, rho_max, 1)
    accumulator = np.zeros(shape=(rho_max * 2, thetas.size), dtype=np.uint8)

    for y, row in enumerate(img):
        for x, col in enumerate(row):
            if col == 0:
                continue

            for i, theta in enumerate(thetas):
                rho = int(np.round(x * np.cos(theta) + y * np.sin(theta)))

                accumulator[rho + rho_max][i] += 1

                if quantize:
                    for kr in range(-k_size, k_size + 1):
                        for ki in range(-k_size, k_size + 1):
                            new_rho = rho + rho_max + kr
                            new_i = i + ki

                            if 0 <= new_rho < accumulator.shape[0] and 0 <= new_i < accumulator.shape[1]:
                                accumulator[new_rho][new_i] += 1 * decrease_f

    return thetas, rhos, accumulator


def hough_points_py(img_shape: Tuple[int, int], points: List[Point], thetas: List[int] = None) -> (
        List[int],
        List[int],
        List[List[int]]
):
    rho_max = int(math.ceil(math.sqrt(img_shape[0] ** 2 + img_shape[1] ** 2)))  # diagonal of the image

    if thetas is None:
        thetas = list(linspace(
            start=-math.pi / 2,
            stop=math.pi / 2,
            num=360,
            endpoint=False
        ))
    rhos = range(-rho_max, rho_max, 1)
    accumulator = [[0 for _ in range(len(thetas))] for __ in range(rho_max * 2)]

    for point in points:
        for i, theta in enumerate(thetas):
            rho = int(round(point.x * math.cos(theta) + point.y * math.sin(theta)))
            accumulator[rho + rho_max][i] += 1

    return thetas, rhos, accumulator


def prominent_peaks(
        img: np.ndarray,
        min_x_dist=1,
        min_y_dist=1,
        threshold=None,
        num_peaks=np.inf
):
    rows, cols = img.shape

    if threshold is None:
        threshold = 0.5 * np.max(img)

    y_coords_size = 2 * min_y_dist + 1
    x_coords_size = 2 * min_x_dist + 1

    img_max = ndi.maximum_filter1d(
        img,
        size=y_coords_size,
        axis=0,
        mode='constant',
        cval=0
    )
    img_max = ndi.maximum_filter1d(
        img_max,
        size=x_coords_size,
        axis=1,
        mode='constant',
        cval=0
    )

    mask = (img == img_max)
    img *= mask

    thresh = img > threshold

    label_img = measure.label(thresh)
    props = measure.regionprops(label_img, img_max)
    props = sorted(props, key=lambda x: x.intensity_max)[::-1]
    coords = np.array([np.round(p.centroid) for p in props], dtype=int)

    img_peaks = []
    y_coords_peaks = []
    x_coords_peaks = []

    y_coords_ext, x_coords_ext = np.mgrid[-min_y_dist:min_y_dist + 1, -min_x_dist:min_x_dist + 1]

    for y_coords_idx, x_coords_idx in coords:
        accumulator = img_max[y_coords_idx, x_coords_idx]

        if accumulator > threshold:
            # absolute coordinate grid for local neighborhood suppression
            y_coords_nh = y_coords_idx + y_coords_ext
            x_coords_nh = x_coords_idx + x_coords_ext

            # no reflection for distance neighborhood
            y_coords_in = np.logical_and(y_coords_nh > 0, y_coords_nh < rows)
            y_coords_nh = y_coords_nh[y_coords_in]
            x_coords_nh = x_coords_nh[y_coords_in]

            # reflect x coords and assume x coords are continuous,
            # e.g. for angles:
            # (..., 88, 89, -90, -89, ..., 89, -90, -89, ...)
            x_coords_low = x_coords_nh < 0
            y_coords_nh[x_coords_low] = rows - y_coords_nh[x_coords_low]
            x_coords_nh[x_coords_low] += cols
            x_coords_high = x_coords_nh >= cols
            y_coords_nh[x_coords_high] = rows - y_coords_nh[x_coords_high]
            x_coords_nh[x_coords_high] -= cols

            # suppress neighborhood
            img_max[y_coords_nh, x_coords_nh] = 0

            # add current feature to peaks
            img_peaks.append(accumulator)
            y_coords_peaks.append(y_coords_idx)
            x_coords_peaks.append(x_coords_idx)

    img_peaks = np.array(img_peaks)
    y_coords_peaks = np.array(y_coords_peaks)
    x_coords_peaks = np.array(x_coords_peaks)

    if num_peaks < len(img_peaks):
        idx_max_sort = np.argsort(img_peaks)[::-1][:num_peaks]
        img_peaks = img_peaks[idx_max_sort]
        y_coords_peaks = y_coords_peaks[idx_max_sort]
        x_coords_peaks = x_coords_peaks[idx_max_sort]

    return img_peaks, x_coords_peaks, y_coords_peaks


def hough_peaks(
        thetas: np.ndarray,  # List[int]
        rhos: np.ndarray,  # List[int]
        accumulator: np.ndarray,  # List[List[int]]
        min_rho=9,
        min_theta=10,
        threshold=None,
        num_peaks=5
) -> (List[int], List[int]):
    min_theta = min(min_theta, accumulator.shape[1])

    peaks, peak_theta_is, peak_rho_is = prominent_peaks(
        accumulator.copy(),
        min_x_dist=min_theta,
        min_y_dist=min_rho,
        threshold=threshold,
        num_peaks=num_peaks
    )

    if len(peaks) > 0:
        return (
            [thetas[peak_theta_i] for peak_theta_i in peak_theta_is],
            [rhos[peak_rho_i] for peak_rho_i in peak_rho_is]
        )

    return [], []


# main
if __name__ == '__main__':
    print('Starting main.')
    # data
    CANVAS_WIDTH = 1400
    CANVAS_HEIGHT = 800

    print('Loading stroke data from JSON file.')
    with open('strokes/line_2.json', 'r') as stroke_f:
        stroke = Stroke(dict_points=json.load(stroke_f))

    print('Creating canvas and drawing the stroke.')
    canvas = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
    stroke.draw_cv(canvas)

    print('Calculating edges.')
    edges = cv2.bitwise_not(
        cv2.threshold(
            cv2.cvtColor(
                canvas,
                cv2.COLOR_BGR2GRAY
            ),
            10,
            255,
            type=cv2.THRESH_BINARY
        )[1]
    ) / 255

    # hough transform
    print('Calculating hough transform.')

    thetas = list(linspace(
        start=-math.pi / 2,
        stop=math.pi / 2,
        num=720,
        endpoint=False
    ))
    thetas, rhos, accumulator = hough_py(edges, thetas=thetas, quantize=True, k_size=2)

    thetas = np.array(thetas)
    rhos = np.array(rhos)
    accumulator = np.array(accumulator)

    # peaks
    print('Calculating hough peaks.')
    peak_thetas, peak_rhos = hough_peaks(thetas, rhos, accumulator)

    # showing the result
    print('Calculating lines from the peaks.')
    lines_args: List[Tuple[float, float]] = []

    for peak_theta, peak_rho in zip(peak_thetas, peak_rhos):
        m = (- np.cos(peak_theta)) / np.sin(peak_theta)
        c = (peak_rho / np.sin(peak_theta))

        lines_args.append((m, c))

    CMAP = random.choice(PYPLOT_CMAPS + CMOCEAN_CMAPS)

    print(f'Number of peaks: {len(lines_args)}')
    print(f'Colormap: {CMAP}')

    plt.imshow(canvas, cmap=CMAP)
    for m, c in lines_args:
        plt.axline((0, c), slope=m, linestyle='-', color=rand_color_hex(), linewidth=2)
    plt.title('Canvas (Image Space)')
    plt.xlim(0, CANVAS_WIDTH)
    plt.ylim(CANVAS_HEIGHT, 0)
    plt.tick_params(top=True, labeltop=True, bottom=False, labelbottom=False)

    plt.figure()
    plt.imshow(accumulator, cmap=CMAP, aspect=0.2)
    cbar = plt.colorbar(label='Votes')
    cbar.ax.set_yticklabels([])
    plt.scatter(
        [np.where(thetas == peak_theta) for peak_theta in peak_thetas],
        [np.where(rhos == peak_rho) for peak_rho in peak_rhos],
        s=10
    )
    plt.xlabel('Angle (degrees)')
    plt.ylabel('Distance (pixels)')
    plt.title('Accumulator (Parameter Space)')

    plt.show()

    print('DONE')
