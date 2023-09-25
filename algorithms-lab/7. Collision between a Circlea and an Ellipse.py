import pygame
from math import sin, cos, atan2, radians

pygame.init()

SW = 1200
SH = 600
WIN = pygame.display
D = WIN.set_mode((SW, SH))


class Circle:
    def __init__(self, radius):
        self.x = 0
        self.y = 0
        self.radius = radius

    def update(self, pos):
        self.x = pos[0]
        self.y = pos[1]

    def draw(self, display):
        pygame.draw.circle(display, (255, 0, 0), (int(self.x), int(self.y)), self.radius, 2)


circle = Circle(30)


class Ellipse:
    def __init__(self, centre, rx, ry):
        self.centre = centre
        self.collided = False
        self.rx = rx
        self.ry = ry

    def draw(self, display):
        angle = 0
        while angle < 6.28:
            angle += 0.001
            x = self.centre[0] + sin(angle) * self.rx
            y = self.centre[1] + cos(angle) * self.ry
            if self.collided:
                display.set_at((int(x), int(y)), (255, 0, 0))
            else:
                display.set_at((int(x), int(y)), (0, 0, 255))
        pygame.draw.circle(D, (0, 255, 0), (int(self.centre[0]), int(self.centre[1])), 5)

    def collision(self, circle):
        # angle to the circle
        dx = circle.x - self.centre[0]
        dy = circle.y - self.centre[1]
        angle = atan2(-dy, dx)
        print(angle)

        # where the point lies in the ellipse at that angle
        x = sin(angle + 1.5) * self.rx + self.centre[0]
        y = cos(angle + 1.5) * self.ry + self.centre[1]
        # print(x, y)

        # drawing the point just to make sure its working
        # (debugging)
        pygame.draw.circle(D, (0, 255, 0), (int(x), int(y)), 5)

        # distance between the point we just
        # calculated and the circle's centre
        distance = ((x - circle.x) ** 2 + (y - circle.y) ** 2) ** 0.5
        # print(distance)

        # collision condition
        if distance < circle.radius:
            self.collided = True
        else:
            self.collided = False


ellipse = Ellipse([600, 300], 300, 200)

while True:
    events = pygame.event.get()
    mousePos = pygame.mouse.get_pos()
    for event in events:
        if event.type == pygame.QUIT:
            pygame.quit()
    D.fill((255, 255, 255))

    circle.update(mousePos)
    circle.draw(D)
    ellipse.draw(D)
    ellipse.collision(circle)

    pygame.display.flip()
