
import sys

def check_mismatch(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    line_no = 1
    col_no = 0
    
    for char in content:
        if char == '\n':
            line_no += 1
            col_no = 0
            continue
        col_no += 1
        
        if char in '({[':
            stack.append((char, line_no, col_no))
        elif char in ')}]':
            if not stack:
                print(f"Extra closing {char} at line {line_no}, col {col_no}")
                continue
            last, l, c = stack.pop()
            if last != pairs[char]:
                print(f"Mismatched {char} at line {line_no}, col {col_no} (expected {last} from line {l}, col {c})")
                # Stop at first mismatch to avoid cascade
                return

    if stack:
        print("Unclosed symbols (last 5):")
        for s, l, c in stack[-5:]:
            print(f"  {s} opened at line {l}, col {c}")

if __name__ == "__main__":
    check_mismatch(sys.argv[1])
