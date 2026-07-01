# scanners/usb_scan.py

import subprocess

def scan_usb():
    try:
        result = subprocess.check_output(
            "wmic path Win32_USBControllerDevice get Dependent",
            shell=True
        )
        return {"usb_devices": result.decode(errors="ignore")}
    except Exception as e:
        return {"error": str(e)}