import subprocess
import time
import sys

def main():
    print("Starting Registry service on port 10000...")
    registry = subprocess.Popen(["uv", "run", "python", "-m", "registry"])
    time.sleep(3)

    print("Starting Tax Agent on port 10102...")
    tax = subprocess.Popen(["uv", "run", "python", "-m", "tax_agent"])

    print("Starting Compliance Agent on port 10103...")
    compliance = subprocess.Popen(["uv", "run", "python", "-m", "compliance_agent"])
    time.sleep(3)

    print("Starting Law Agent on port 10101...")
    law = subprocess.Popen(["uv", "run", "python", "-m", "law_agent"])
    time.sleep(3)

    print("Starting Customer Agent on port 10100...")
    customer = subprocess.Popen(["uv", "run", "python", "-m", "customer_agent"])

    print("\nAll services started:")
    print("  Registry:         http://localhost:10000")
    print("  Customer Agent:   http://localhost:10100")
    print("  Law Agent:        http://localhost:10101")
    print("  Tax Agent:        http://localhost:10102")
    print("  Compliance Agent: http://localhost:10103")
    print("\nRun test_client.py to send a query:")
    print("  uv run python test_client.py")
    print("\nPress Ctrl+C to stop all services.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping all services...")
        customer.terminate()
        law.terminate()
        compliance.terminate()
        tax.terminate()
        registry.terminate()

if __name__ == "__main__":
    main()
