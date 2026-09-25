import { Injectable } from '@angular/core';
import { registerPlugin } from '@capacitor/core';

interface DeviceNamePlugin {
  getDeviceName(): Promise<{
    name: string;
  }>;
}

const DeviceName =
  registerPlugin<DeviceNamePlugin>('DeviceName');

@Injectable({
  providedIn: 'root'
})
export class DeviceNameService {

  async getName(): Promise<string> {

    try {

      console.log(
        '[DeviceName] Requesting Android device name...'
      );

      const result =
        await DeviceName.getDeviceName();

      console.log(
        '[DeviceName] Native plugin result:',
        result
      );

      const name =
        result?.name?.trim();

      if (name) {

        console.log(
          '[DeviceName] Android custom name:',
          name
        );

        return name;
      }

    } catch (error) {

      console.error(
        '[DeviceName] Failed to get Android device name:',
        error
      );
    }

    console.warn(
      '[DeviceName] Falling back to Android Device'
    );

    return 'Android Device';
  }
}