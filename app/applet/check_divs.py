import sys

def check_div_mismatch(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Simplistic tag finder
        start = 0
        while True:
            open_div = line.find('<div', start)
            close_div = line.find('</div', start)
            
            if open_div == -1 and close_div == -1:
                break
                
            if open_div != -1 and (close_div == -1 or open_div < close_div):
                # Check if it's self-closing <div />
                tag_end = line.find('>', open_div)
                if tag_end != -1 and line[tag_end-1] == '/':
                    # Self closing, ignore
                    pass
                else:
                    stack.append(line_num)
                start = open_div + 4
            else:
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing div at line {line_num}")
                start = close_div + 5
                
    if stack:
        print(f"Unclosed divs starting at lines: {stack}")
    else:
        print("Divs are balanced")

if __name__ == "__main__":
    check_div_mismatch(sys.argv[1])
