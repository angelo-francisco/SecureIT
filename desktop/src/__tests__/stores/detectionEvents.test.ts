import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDetectionEventsStore } from "@/stores/detectionEvents";

describe("useDetectionEventsStore", () => {
  beforeEach(() => {
    useDetectionEventsStore.getState().clearEvents();
  });

  it("starts with empty events", () => {
    const { events } = useDetectionEventsStore.getState();
    expect(events).toEqual([]);
  });

  it("adds a people detection event", () => {
    useDetectionEventsStore.getState().addEvent({
      type: "people",
      person_id: null,
      name: "2 pessoa(s) detetada(s)",
      unknown: false,
      confidence: null,
      camera_id: 1,
      camera_name: "CAM-1",
      timestamp: Date.now(),
    });

    const { events } = useDetectionEventsStore.getState();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("people");
    expect(events[0].name).toBe("2 pessoa(s) detetada(s)");
    expect(events[0].camera_name).toBe("CAM-1");
  });

  it("adds a face detection event", () => {
    useDetectionEventsStore.getState().addEvent({
      type: "face",
      person_id: 42,
      name: "John Doe",
      unknown: false,
      confidence: 0.95,
      camera_id: 2,
      camera_name: "CAM-2",
      timestamp: Date.now(),
    });

    const { events } = useDetectionEventsStore.getState();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("face");
    expect(events[0].person_id).toBe(42);
    expect(events[0].confidence).toBe(0.95);
  });

  it("adds a behaviour detection event", () => {
    useDetectionEventsStore.getState().addEvent({
      type: "behaviour",
      person_id: null,
      name: "Movimento suspeito detetado (intensidade: 42.5)",
      unknown: false,
      confidence: null,
      camera_id: 3,
      camera_name: "CAM-3",
      timestamp: Date.now(),
    });

    const { events } = useDetectionEventsStore.getState();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("behaviour");
    expect(events[0].name).toContain("Movimento suspeito");
    expect(events[0].camera_id).toBe(3);
  });

  it("assigns auto-incrementing IDs", () => {
    const now = Date.now();
    useDetectionEventsStore.getState().addEvent({
      type: "people",
      person_id: null,
      name: "Event 1",
      unknown: false,
      confidence: null,
      camera_id: 1,
      camera_name: "CAM-1",
      timestamp: now,
    });
    useDetectionEventsStore.getState().addEvent({
      type: "face",
      person_id: 1,
      name: "Event 2",
      unknown: false,
      confidence: 0.8,
      camera_id: 2,
      camera_name: "CAM-2",
      timestamp: now,
    });
    useDetectionEventsStore.getState().addEvent({
      type: "behaviour",
      person_id: null,
      name: "Event 3",
      unknown: false,
      confidence: null,
      camera_id: 3,
      camera_name: "CAM-3",
      timestamp: now,
    });

    const { events } = useDetectionEventsStore.getState();
    expect(events).toHaveLength(3);
    expect(events[0].id).not.toBe(events[1].id);
    expect(events[1].id).not.toBe(events[2].id);
  });

  it("caps events at 100 (slice oldest)", () => {
    for (let i = 0; i < 120; i++) {
      useDetectionEventsStore.getState().addEvent({
        type: "people",
        person_id: null,
        name: `Event ${i}`,
        unknown: false,
        confidence: null,
        camera_id: 1,
        camera_name: "CAM-1",
        timestamp: Date.now() + i,
      });
    }

    const { events } = useDetectionEventsStore.getState();
    expect(events).toHaveLength(100);
    expect(events[0].name).toBe("Event 20");
    expect(events[99].name).toBe("Event 119");
  });

  it("clearEvents empties the store", () => {
    useDetectionEventsStore.getState().addEvent({
      type: "behaviour",
      person_id: null,
      name: "Test",
      unknown: false,
      confidence: null,
      camera_id: 1,
      camera_name: "CAM-1",
      timestamp: Date.now(),
    });

    expect(useDetectionEventsStore.getState().events).toHaveLength(1);
    useDetectionEventsStore.getState().clearEvents();
    expect(useDetectionEventsStore.getState().events).toHaveLength(0);
  });
});
