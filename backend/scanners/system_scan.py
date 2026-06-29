import platform
import psutil


def scan_system():

    battery = psutil.sensors_battery()

    return {

        "computer":
        platform.node(),

        "system":
        platform.system(),

        "processor":
        platform.processor(),

        "ram_gb":
        round(
            psutil.virtual_memory().total / (1024**3),
            2
        ),

        "battery":
        battery.percent if battery else "Desktop"

    }