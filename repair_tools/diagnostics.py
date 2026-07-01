import psutil


def diagnose_system():

    problems = []


    cpu = psutil.cpu_percent(interval=1)

    memory = psutil.virtual_memory()


    if cpu > 90:

        problems.append(
            "High CPU usage detected"
        )


    if memory.percent > 85:

        problems.append(
            "High RAM usage detected"
        )


    if not problems:

        problems.append(
            "No major system faults detected"
        )


    return {

        "cpu_usage": cpu,

        "ram_usage": memory.percent,

        "faults": problems,

        "recommendation":

        "Run deeper AI diagnosis if needed"

    }