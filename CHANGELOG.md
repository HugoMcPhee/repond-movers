v0.5.0

- moving to be importable package :)
- TODO update mover2d and mover3d to check distance and shouldKeepMoving speed, so it dosen't trigger from average speed at the start

v0.4.3

- updated mover2d and mover3d to check lower value for the springs shouldKeepMoving speed

v0.4.2

- updated mover2d and mover3d to check shouldKeepMoving before the setState (like mover (1d) does)
- removed interpolate from mover to fix on iPad

v0.4.1

- updated mover2d and mover3d to use point inPlace mutable functions to avoid creating lots of objects in a physics step,
  which could cause garbage collection stuttering

v0.4.0

- added moverMulti to allow a single mover with multiple values (useful for animation weights, or styles)
- removoed some eslint warnings

v0.3.1

- added initialState for moverState

v0.3.01

- cleaning up a little bit, and changing MoveMode to have "push" and "drag"

v0.3.0

- adding auto property making scripts with typescript 4.1 dynamic names

v0.2.0

- changes stateland 'scraps' to concepto 'refs'

v0.1.2

- added safer update position to mover2d (that was in mover3d)

v0.1.1

- more optional states and simplified some places
