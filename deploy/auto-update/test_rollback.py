"""Exercise rollback at each interrupted directory-switch boundary on Linux."""
import pathlib
import subprocess
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).with_name('update.sh').read_text()
FUNCTION = SCRIPT[SCRIPT.index('cleanup() {'):SCRIPT.index('trap cleanup EXIT')]

class RollbackTests(unittest.TestCase):
    def check_boundary(self, boundary):
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            live = root / 'live'
            previous = root / 'previous'
            candidate = root / 'candidate-test'
            log = root / 'calls'
            if boundary == 'before_move':
                live.mkdir(); (live / 'version').write_text('old')
                candidate.mkdir(); (candidate / 'version').write_text('new')
            elif boundary == 'after_old_move':
                previous.mkdir(); (previous / 'version').write_text('old')
                candidate.mkdir(); (candidate / 'version').write_text('new')
            else:
                previous.mkdir(); (previous / 'version').write_text('old')
                live.mkdir(); (live / 'version').write_text('new')
            function = FUNCTION.replace('/opt/stkcraft-geocalc', str(live)).replace('/opt/stkcraft-releases/candidate-*', str(root / 'candidate-*'))
            shell = f'''set -e
candidate='{candidate}'
previous='{previous}'
live_stopped=1
committed=0
systemctl() {{ printf '%s\\n' "$*" >> '{log}'; }}
{function}
trap cleanup EXIT
false
'''
            result = subprocess.run(['bash', '-c', shell], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1, result.stderr)
            self.assertEqual((live / 'version').read_text(), 'old')
            self.assertIn('start stkcraft-geocalc', log.read_text())
            self.assertFalse(candidate.exists())

    def test_before_first_move(self): self.check_boundary('before_move')
    def test_after_old_directory_move(self): self.check_boundary('after_old_move')
    def test_after_new_directory_move(self): self.check_boundary('after_new_move')

if __name__ == '__main__': unittest.main()
