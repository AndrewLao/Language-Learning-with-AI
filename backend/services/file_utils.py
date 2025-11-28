def write_to_file(file_path, data):
    """
    Writes the given data to a file at the specified file path.

    Args:
        file_path (str): The path to the file where data should be written.
        data (str): The data to write to the file.

    Returns:
        None
    """
    with open(file_path, 'a', encoding='utf-8') as file:
        file.write(data)

def clear_file(file_path):
    """
    Clears the contents of the specified file.

    Args:
        file_path (str): The path to the file to be cleared.

    Returns:
        None
    """
    open(file_path, 'w', encoding='utf-8').close()
# Example usage:
# write_to_file('output.txt', 'Hello, World!')