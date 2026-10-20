import sys

def check_div_mismatch(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Find all <div (not self-closing)
        import re
        opens = re.findall(r'<div(?![^>]*/>)', line)
        closes = re.findall(r'</div>', line)
        
        for _ in opens:
            stack.append(line_num)
        
        for _ in closes:
            if stack:
                stack.pop()
            else:
                print(f"Extra closing div at line {line_num}")
                
    if stack:
        print(f"Unclosed divs starting at lines: {stack}")
    else:
        print("Divs are balanced")

if __name__ == "__main__":
    check_div_mismatch(sys.argv[1])
