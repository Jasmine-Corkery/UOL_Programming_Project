
import { Accelerometer } from "expo-sensors";

class DropDetectionService {
  constructor() {
    this.subscription = null;
    this.isMonitoring = false;
    this.freeFallDetected = false;
    this.lastTriggerTime = 0;

    this.FREE_FALL_THRESHOLD = 0.5;
    this.IMPACT_THRESHOLD = 2.5;
    this.DEBOUNCE_TIME = 3000;

    this.onDropCallback = null;
  }

  start(onDropDetected) {
    if (this.isMonitoring) return;

    this.onDropCallback = onDropDetected;
    this.isMonitoring = true;

    Accelerometer.setUpdateInterval(100);

    this.subscription = Accelerometer.addListener((data) => {
      const totalForce = Math.sqrt(
        data.x * data.x + data.y * data.y + data.z * data.z,
      );

      const now = Date.now();

      if (totalForce < this.FREE_FALL_THRESHOLD) {
        this.freeFallDetected = true;
      }

      if (
        this.freeFallDetected &&
        totalForce > this.IMPACT_THRESHOLD &&
        now - this.lastTriggerTime > this.DEBOUNCE_TIME
      ) {
        this.lastTriggerTime = now;
        this.freeFallDetected = false;

        if (this.onDropCallback) {
          this.onDropCallback();
        }
      }
    });
  }

  stop() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    this.isMonitoring = false;
    this.freeFallDetected = false;
  }
}

export default new DropDetectionService();
