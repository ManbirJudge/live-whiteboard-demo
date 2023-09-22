import math
import random

import cv2
import numpy as np


def describe_circle(contour):
    return cv2.minEnclosingCircle(contour)


# loading image
image = cv2.imread(f'images/circle_{random.randint(1, 4)}.png')

gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
blurred = cv2.GaussianBlur(gray, (9, 9), 2)
edges = cv2.Canny(blurred, 50, 150)

# contours
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# accumulator
accumulator = np.zeros((image.shape[0], image.shape[1], math.ceil(max(image.shape) / 2)), dtype=np.uint64)

# Generalized Hough Transform for circles
for contour in contours:
    shape_desc = describe_circle(contour)
    center, radius = shape_desc

    x_center, y_center = map(int, center)
    accumulator[y_center, x_center] += 1

# peak detection
y_peak, x_peak = np.unravel_index(accumulator.argmax(), accumulator.shape)
centre_peak = (x_peak, y_peak)

# result
cv2.circle(image, centre_peak, radius=3, color=(0, 255, 0), thickness=-1, lineType=cv2.LINE_AA)

cv2.imshow('Detected Circles', image)
cv2.waitKey(0)
cv2.destroyAllWindows()
