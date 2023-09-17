import json

import cv2
import numpy as np

from Utils import Stroke

CANVAS_WIDTH = 800
CANVAS_HEIGHT = 300

with open('strokes/line_2.json', 'r') as stroke_f:
    stroke = Stroke(dict_points=json.load(stroke_f))
    points = stroke.to_py()

canvas = np.ones(shape=(CANVAS_HEIGHT, CANVAS_WIDTH, 3), dtype=np.uint8) * 255
stroke.draw_cv(canvas)

gray = cv2.cvtColor(
    canvas,
    cv2.COLOR_BGR2GRAY
)
_, thresh = cv2.threshold(
    gray,
    10,
    255,
    type=cv2.THRESH_BINARY
)
inverse = cv2.bitwise_not(thresh)
norm = inverse / 255

cv2.imshow('Canvas', canvas)
cv2.imshow('Grayscale', gray)
cv2.imshow('Threshed', thresh)
cv2.imshow('Inversed', inverse)

cv2.waitKey(0)

for y, row in enumerate(norm):
    for x, col in enumerate(row):
        print(x + 1, y + 1)
