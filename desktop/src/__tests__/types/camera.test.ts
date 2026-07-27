import { describe, it, expect } from "vitest";
import type { Camera, CameraFormData, CameraTask, ConnectionType } from "@/types/camera";

describe("CameraTask type", () => {
  it("accepts valid task values", () => {
    const tasks: CameraTask[] = ["D", "FR", "BA"];
    expect(tasks).toHaveLength(3);
    expect(tasks).toContain("D");
    expect(tasks).toContain("FR");
    expect(tasks).toContain("BA");
  });

  it("D represents area detection", () => {
    const task: CameraTask = "D";
    expect(task).toBe("D");
  });

  it("FR represents face recognition", () => {
    const task: CameraTask = "FR";
    expect(task).toBe("FR");
  });

  it("BA represents behaviour analysis", () => {
    const task: CameraTask = "BA";
    expect(task).toBe("BA");
  });
});

describe("Camera interface", () => {
  const makeCamera = (overrides?: Partial<Camera>): Camera => ({
    id: 1,
    name: "CAM-1",
    location: "Entrada",
    status: true,
    connection_type: "L",
    connection_info: null,
    video_source: 0,
    face_recognition: false,
    task: "D",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    get_name: "CAM-1 (Entrada)",
    ...overrides,
  });

  it("has task field defaulting to D", () => {
    const cam = makeCamera();
    expect(cam.task).toBe("D");
  });

  it("can have task FR", () => {
    const cam = makeCamera({ task: "FR", face_recognition: true });
    expect(cam.task).toBe("FR");
    expect(cam.face_recognition).toBe(true);
  });

  it("can have task BA", () => {
    const cam = makeCamera({ task: "BA" });
    expect(cam.task).toBe("BA");
  });
});

describe("CameraFormData", () => {
  it("task is optional in form data", () => {
    const form: CameraFormData = {
      name: "CAM-1",
      location: "Entrada",
      connection_type: "L",
      connection_info: {},
    };
    expect(form.task).toBeUndefined();
  });

  it("task can be set in form data", () => {
    const form: CameraFormData = {
      name: "CAM-1",
      location: "Entrada",
      connection_type: "L",
      connection_info: {},
      task: "BA",
    };
    expect(form.task).toBe("BA");
  });
});
