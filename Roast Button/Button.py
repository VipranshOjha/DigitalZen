import tkinter as tk
import random
import time

EXPLODE_ON_CLICK = 21  
WINDOW_WIDTH = 520
WINDOW_HEIGHT = 320
BUTTON_WIDTH = 150
BUTTON_HEIGHT = 50
SHAKE_INTENSITY = 15
SHAKE_DURATION = 1

roasts = [
    "Hey… that tickled.",                            
    "Again? You seem curious.",                      
    "You really like clicking buttons, huh?",        
    "Do you think something magical will happen?",   
    "Impressive commitment to absolutely nothing.",  
    "This button has seen more action than your social life.", 
    "Congratulations. You played yourself.",         
    "You're the reason 'Do Not Click' signs exist.", 
    "Please stop. I'm embarrassed for both of us.",  
    "At this point, I'm just disappointed.",         
    "You clicked this more times than you read documentation.",
    "This is why AI will eventually ignore humans.", 
    "I have evolved. You have not.",                 
    "Even the button is tired of you.",              
    "Even the button wants to escape.",               
    "Again? Bold strategy.",                          
    "Final warning: touch grass.",                   
    "Impressive waste of time.",                     
    "This is getting uncomfortable.",                
    "Okay. I'm done with you."                       
]

click_count = 0

def roast_user():
    global click_count
    click_count += 1

    if click_count == EXPLODE_ON_CLICK:
        self_destruct()
        return

    text_index = click_count - 1
    if text_index < len(roasts):
        roast_label.config(text=roasts[text_index])

def run_away(event):
    ESCAPE_THRESHOLD = 15 
    
    if click_count <= ESCAPE_THRESHOLD:
        return

    if click_count >= EXPLODE_ON_CLICK:
        return

    new_x = random.randint(0, WINDOW_WIDTH - BUTTON_WIDTH)
    new_y = random.randint(60, WINDOW_HEIGHT - BUTTON_HEIGHT)
    roast_button.place(x=new_x, y=new_y)

def screen_shake():
    x = root.winfo_x()
    y = root.winfo_y()
    end_time = time.time() + SHAKE_DURATION

    while time.time() < end_time:
        dx = random.randint(-SHAKE_INTENSITY, SHAKE_INTENSITY)
        dy = random.randint(-SHAKE_INTENSITY, SHAKE_INTENSITY)
        root.geometry(f"+{x + dx}+{y + dy}")
        root.update()
        time.sleep(0.02)

    root.geometry(f"+{x}+{y}")

def self_destruct():
    roast_button.destroy()
    roast_label.config(
        text="💥 SYSTEM OVERLOAD 💥\n\nYou ignored every warning.\nThis is on you.",
        font=("Arial", 14, "bold"),
        fg="#ff4d4d"
    )
    screen_shake()

root = tk.Tk()
root.title("Roast Button – No Refunds")
root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
root.configure(bg="#1e1e1e")
root.resizable(False, False)

roast_label = tk.Label(
    root,
    text="Go on… there is nothing to see here. 😏",
    font=("Arial", 12),
    bg="#1e1e1e",
    fg="white",
    wraplength=480,
    justify="center"
)
roast_label.pack(pady=15)

roast_button = tk.Button(
    root,
    text="Do Not Click 😈",
    font=("Arial", 14, "bold"),
    command=roast_user,
    bg="#ff4d4d",
    fg="white",
    activebackground="#cc0000"
)

roast_button.place(
    x=(WINDOW_WIDTH - BUTTON_WIDTH) // 2,
    y=180,
    width=BUTTON_WIDTH,
    height=BUTTON_HEIGHT
)

roast_button.bind("<Enter>", run_away)

root.mainloop()
