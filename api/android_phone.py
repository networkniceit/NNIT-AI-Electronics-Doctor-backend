from fastapi import APIRouter
import subprocess
import re

router = APIRouter()


def run_cmd(cmd):
    try:
        result = subprocess.check_output(
            cmd,
            shell=True,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=15
        )
        return result.strip()
    except Exception as e:
        return str(e)


def find_value(text, key):
    match = re.search(rf"^\s*{re.escape(key)}:\s*(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else None


def to_int(value):
    if value is None:
        return None

    value = str(value).strip()

    if value.isdigit():
        return int(value)

    return None


@router.get("/android-phone")
def android_phone():
    connection = run_cmd("adb devices")

    connected = bool(
        re.search(r"\bdevice\b", connection)
        and "unauthorized" not in connection.lower()
        and "offline" not in connection.lower()
    )

    if not connected:
        return {
            "connection": connection,
            "connected": False,
            "brand": "Not connected",
            "model": "Not connected",
            "android_version": "Not connected",
            "battery": None,
            "temperature": None,
            "voltage": None,
            "health": "Unknown",
            "charging": False,
            "technology": "Unknown",
            "battery_protection": "Unknown",
            "protection_limit": None,
            "battery_info": ""
        }

    brand = run_cmd("adb shell getprop ro.product.brand")
    model = run_cmd("adb shell getprop ro.product.model")
    android_version = run_cmd("adb shell getprop ro.build.version.release")
    battery_info = run_cmd("adb shell dumpsys battery")

    level = to_int(find_value(battery_info, "level"))
    temperature_raw = to_int(find_value(battery_info, "temperature"))

    voltage_match = re.search(
        r"^\s*voltage:\s*(\d+)",
        battery_info,
        re.MULTILINE
    )
    voltage = int(voltage_match.group(1)) if voltage_match else None

    health_code = find_value(battery_info, "health")
    status_code = find_value(battery_info, "status")

    usb_powered = find_value(battery_info, "USB powered")
    ac_powered = find_value(battery_info, "AC powered")
    wireless_powered = find_value(battery_info, "Wireless powered")

    technology = find_value(battery_info, "technology")

    protection_mode = find_value(battery_info, "mProtectBatteryMode")
    protection_threshold = to_int(find_value(battery_info, "mProtectionThreshold"))

    health_map = {
        "1": "Unknown",
        "2": "Good",
        "3": "Overheat",
        "4": "Dead",
        "5": "Over voltage",
        "6": "Unspecified failure",
        "7": "Cold"
    }

    status_map = {
        "1": "Unknown",
        "2": "Charging",
        "3": "Discharging",
        "4": "Not charging",
        "5": "Full"
    }

    charging = (
        usb_powered == "true"
        or ac_powered == "true"
        or wireless_powered == "true"
    )

    return {
        "connection": connection,
        "connected": True,
        "brand": brand,
        "model": model,
        "android_version": android_version,

        "battery": level,
        "temperature": round(temperature_raw / 10, 1) if temperature_raw is not None else None,
        "voltage": voltage,

        "health": health_map.get(str(health_code), health_code or "Unknown"),
        "status": status_map.get(str(status_code), status_code or "Unknown"),
        "charging": charging,
        "technology": technology or "Unknown",

        "battery_protection": "ON" if protection_mode == "1" else "OFF",
        "protection_limit": protection_threshold,

        "battery_info": battery_info
    }