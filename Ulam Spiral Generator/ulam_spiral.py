#!/usr/bin/env python3
"""
Ulam Spiral Generator
Generates and displays a Ulam Spiral based on user-provided grid size.
"""

def is_prime(num):
    """
    Check if a number is prime.
    
    Args:
        num: Integer to check for primality
        
    Returns:
        True if the number is prime, False otherwise
    """
    if num < 2:
        return False
    if num == 2:
        return True
    if num % 2 == 0:
        return False
    
    # Check odd divisors up to sqrt(num)
    for i in range(3, int(num ** 0.5) + 1, 2):
        if num % i == 0:
            return False
    return True


def get_valid_input():
    """
    Get a valid positive odd integer from the user.
    
    Returns:
        A positive odd integer
    """
    while True:
        try:
            n = int(input("Please enter an odd number for the grid size: "))
            
            if n <= 0:
                print("Error: Please enter a positive number.")
            elif n % 2 == 0:
                print("Error: Please enter an odd number.")
            else:
                return n
                
        except ValueError:
            print("Error: Invalid input. Please enter a valid integer.")


def generate_ulam_spiral(n):
    """
    Generate an n x n Ulam spiral.
    
    Args:
        n: Size of the grid (must be odd)
        
    Returns:
        A 2D list representing the Ulam spiral
    """
    # Initialize grid with zeros
    grid = [[0] * n for _ in range(n)]
    
    # Start from the center
    x = n // 2
    y = n // 2
    
    # Place the first number
    num = 1
    grid[y][x] = num
    num += 1
    
    # Direction vectors: right, down, left, up
    dx = [1, 0, -1, 0]
    dy = [0, 1, 0, -1]
    
    # Start moving right
    direction = 0
    steps_in_direction = 1
    steps_taken = 0
    direction_changes = 0
    
    while num <= n * n:
        # Take a step in the current direction
        x += dx[direction]
        y += dy[direction]
        
        # Check bounds
        if 0 <= x < n and 0 <= y < n:
            grid[y][x] = num
            num += 1
        
        steps_taken += 1
        
        # Check if we need to change direction
        if steps_taken == steps_in_direction:
            steps_taken = 0
            direction = (direction + 1) % 4
            direction_changes += 1
            
            # Increase steps after every two direction changes
            if direction_changes % 2 == 0:
                steps_in_direction += 1
    
    return grid


def display_spiral(grid):
    """
    Display the Ulam spiral with primes marked as '*' and non-primes as '.'.
    
    Args:
        grid: 2D list representing the Ulam spiral
    """
    for row in grid:
        for num in row:
            if is_prime(num):
                print("* ", end="")
            else:
                print(". ", end="")
        print()  # New line after each row


def main():
    """
    Main function to run the Ulam Spiral Generator.
    """
    print("Ulam Spiral Generator")
    print("=" * 30)
    print()
    
    # Get valid input from user
    n = get_valid_input()
    
    print(f"\nGenerating {n}x{n} Ulam Spiral...")
    print()
    
    # Generate the spiral
    spiral = generate_ulam_spiral(n)
    
    # Display the result
    display_spiral(spiral)
    
    # Optional: Show some statistics
    print()
    total_numbers = n * n
    prime_count = sum(1 for row in spiral for num in row if is_prime(num))
    print(f"Statistics:")
    print(f"  Total numbers: {total_numbers}")
    print(f"  Prime numbers: {prime_count}")
    print(f"  Prime density: {prime_count/total_numbers:.1%}")


if __name__ == "__main__":
    main()