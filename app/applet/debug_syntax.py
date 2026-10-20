
import sys

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Simple stack-based balance check for braces and parentheses
    # Note: This doesn't handle strings/comments perfectly but might be enough
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    line_no = 1
    col_no = 0
    
    in_string = False
    string_char = ''
    
    for char in content:
        if char == '\n':
            line_no += 1
            col_no = 0
            continue
        col_no += 1
        
        if in_string:
            if char == string_char:
                # Check for escaped char
                # (very simple check)
                in_string = False
            continue
        
        if char in '"\'`':
            in_string = True
            string_char = char
            continue
            
        if char in '({[':
            stack.append((char, line_no, col_no))
        elif char in ')}]':
            if not stack:
                print(f"Extra closing {char} at line {line_no}, col {col_no}")
                continue
            last, l, c = stack.pop()
            if last != pairs[char]:
                print(f"Mismatched {char} at line {line_no}, col {col_no} (expected {last} from line {l}, col {c})")
    
    if stack:
        print("Unclosed symbols:")
        for s, l, c in stack:
            print(f"  {s} opened at line {l}, col {c}")

def check_divs(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Very simple div finder
        if '<div' in line:
            # Count how many <div are in the line
            count = line.count('<div')
            for _ in range(count):
                stack.append(line_num)
        if '</div' in line:
            count = line.count('</div')
            for _ in range(count):
                if stack:
                    stack.pop()
                else:
                    print(f"Extra </div> at line {line_num}")
    
    if stack:
        print("Unclosed <div> tags opened at lines:")
        for l in stack:
            print(f"  {l}")

if __name__ == "__main__":
    filename = sys.argv[1]
    print("--- Braces/Parentheses ---")
    check_balance(filename)
    print("\n--- Divs ---")
    check_divs(filename)
