// Camera poses. HOME is where the camera rests; each hotspot has an approach pose.
export const HOME = { pos: [0, 0, 2], look: [0, 0, -1] }
export const INTRO_START = { pos: [0, 0.08, 3.7], look: [0, 0, -1] }

export const POSES = {
  monitor:  { pos: [-0.18, 0.33, 0.58], look: [-0.18, 0.33, -1] },
  handheld: { pos: [1.26, -0.21, 0.42], look: [1.26, -0.21, -1] },
  tray:     { pos: [-1.39, -0.63, 0.62], look: [-1.39, -0.63, -1] },
  frame:    { pos: [-1.45, -0.20, 0.48], look: [-1.45, -0.20, -1] },
  mug:      { pos: [-0.75, -0.49, 0.46], look: [-0.75, -0.49, -1] },
  notes:    { pos: [-1.20, 0.57, 0.50], look: [-1.20, 0.57, -1] },
  musicbox: { pos: [-0.99, -0.03, 0.48], look: [-0.99, -0.03, -1] },
  plant:    { pos: [-1.75, -0.22, 0.68], look: [-1.82, -0.22, -1] },
  keyboard: { pos: [-0.03, -0.46, 0.58], look: [-0.03, -0.46, -1] },
  mouse:    { pos: [0.62, -0.40, 0.52],  look: [0.62, -0.40, -1] },
  candle:   { pos: [1.66, -0.26, 0.66],  look: [1.73, -0.26, -1] },
  shelf:    { pos: [1.02, 0.39, 0.72],   look: [1.02, 0.39, -1] }
}
