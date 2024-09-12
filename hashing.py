import hashlib

# Define a hashing function that uses SHA-256
def hash_string(input_string):
hash_object = hashlib.sha256()  # Create a new SHA-256 hash object
  hash_object.update(input_string.encode('utf-8')) # Encode the input string and update the hash object
  return hash_object.hexdigest()  # Return the hexadecimal representation of the hash

# Example usage
input_data = input("Enter what you want hashed\n")
hashed_value = hash_string(input_data)
print(f'Original: {input_data}')
print(f'Hashed: {hashed_value}')
if hash_string(input_data) == hashed_value:
    print("True")
else:
    print("False")
