#print("quit")

def main():
    # Program B waits for input from Program A
    user_input = input("Program B waiting for input: ")
    print("quit", user_input)

    # Program B processes the input and sends back a response
    response = "Response from Program B"
    print(response)

if __name__ == "__main__":
    main()