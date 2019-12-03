import os
import signal
import subprocess
import sys


def kill(pid):
    print('Killing pid: {}'.format(pid))
    os.kill(pid, signal.SIGTERM)


def run(cmd):
    out = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    stdout, _stderr = out.communicate()
    return stdout.decode('utf-8')


def parse_res(res):
    lines = res.split('\n')
    for i, line in enumerate(lines):
        if i > 0 and len(line) > 0:
            pid = int(line.split()[1])
            yield pid


def kill_process_for_port(port):
    cmd = ['lsof', '-i', ':{}'.format(port)]
    res = run(cmd)
    if len(res) > 0:
        for pid in parse_res(res):
            kill(pid)


ports = sys.argv[1:]
for port in ports:
    kill_process_for_port(port)
