# imports
import cv2
import numpy as np

# reading and preprocessing
img = cv2.imread('images/download (4).png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
edges = cv2.Canny(gray, 50, 150, apertureSize=3)

# detecting lines
lines = []
hough_lines = cv2.HoughLinesP(
    edges,              # input edge image
    1,                  # distance resolution (in pixels)
    np.pi / 180,        # theta resolution (in radians)
    threshold=100,      # min number of votes for valid line
    minLineLength=5,    # min allowed length of line
    maxLineGap=10       # max allowed gap between line for joining them
)
# showing the result
result = img.copy()

if hough_lines is not None:
    for line in hough_lines:
        x1, y1, x2, y2 = line[0]

        cv2.line(result, (x1, y1), (x2, y2), (0, 0, 255), 1, cv2.LINE_AA)
        lines.append([(x1, y1), (x2, y2)])

cv2.imshow('Original', img)
cv2.imshow('Gray', gray)
cv2.imshow('Edges (Canny)', edges)
cv2.imshow('Lines', result)

cv2.waitKey(0)
