// Camera poses. HOME is where the camera rests; each hotspot has an approach pose.
export const HOME = { pos: [0, 1.3, 1.6], look: [0, 0.98, -0.18] }
export const INTRO_START = { pos: [0, 1.58, 3.1], look: [0, 1.0, -0.2] }

export const POSES = {
  monitor:  { pos: [0, 1.24, 0.62],     look: [0, 1.2, -0.16] },
  handheld: { pos: [0.52, 1.06, 0.66],  look: [0.55, 0.8, 0.22] },
  tray:     { pos: [-0.52, 1.08, 0.68], look: [-0.6, 0.79, 0.18] },
  frame:    { pos: [-0.38, 1.02, 0.22], look: [-0.52, 0.84, -0.28] },
  mug:      { pos: [0.33, 1.02, 0.6],   look: [0.33, 0.85, 0.12] },
  notes:    { pos: [0.42, 1.3, 0.42],   look: [0.315, 1.27, -0.13] },
  musicbox: { pos: [-0.26, 1.0, 0.5],   look: [-0.3, 0.81, -0.02] }
}
