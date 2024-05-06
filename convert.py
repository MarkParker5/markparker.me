from PIL import Image
import os


def trim_transparent_borders(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def add_transparent_border(img: Image.Image, border_size: int) -> Image.Image:
    new_size = (img.width + 2 * border_size, img.height + 2 * border_size)
    new_img = Image.new('RGBA', new_size)
    new_img.paste(img, (border_size, border_size))
    return new_img

def add_background(img: Image.Image) -> Image.Image:
    bg_color = (28, 28, 28)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    background = Image.new('RGBA', img.size, bg_color + (255,))
    combined = Image.alpha_composite(background, img)
    return combined.convert('RGB')

def resize_image(img: Image.Image, max_width: int, max_height: int | None = None) -> Image.Image:
    scale_ratio = max_width / img.width

    if max_height and img.height * scale_ratio > max_height:
        scale_ratio = max_height / img.height

    if scale_ratio >= 1:
        return img

    new_width = int(img.width * scale_ratio)
    new_height = int(img.height * scale_ratio)
    img = img.resize((new_width, new_height), Image.LANCZOS)

    return img

def convert_to_webp(img: Image.Image, output_path: str) -> None:
    img.save(output_path, 'WEBP')

def print_image_stats(name: str, before_size: int, after_size: int, before_dims: tuple, after_dims: tuple) -> None:
    before_size_mb = before_size / (1024 * 1024)
    after_size_mb = after_size / (1024 * 1024)
    pixel_reduction = int((after_dims[0] * after_dims[1]) / (before_dims[0] * before_dims[1]) * 100)
    print(f'\n{name}')
    print(f'Before: {before_dims[0]}x{before_dims[1]}, {before_size_mb:.2f} MB')
    print(f'After: {after_dims[0]}x{after_dims[1]}, {after_size_mb:.2f} MB')
    print(f'Size reduction: {100 - pixel_reduction}%')

def process_image(img_path: str, directory: str, max_width: int, max_height: int | None = None) -> None:
    border_size = 50

    before_size = os.path.getsize(img_path)
    with Image.open(img_path) as img:
        before_dims = img.size

        img = trim_transparent_borders(img)
        img = resize_image(img, max_width - border_size*2, max_height - border_size*2 if max_height else None)
        img = add_transparent_border(img, border_size)
        # img = add_background(img)

        after_dims = img.size
        output_path = img_path.rsplit('.', 1)[0] + '.webp'
        convert_to_webp(img, output_path)
        after_size = os.path.getsize(output_path)
        print_image_stats(img_path, before_size, after_size, before_dims, after_dims)
        if img_path != output_path:
            os.remove(img_path)

def resize_and_convert_directory(directory: str, max_width: int, max_height: int | None = None, skip_webp: bool = True) -> None:
    total_before_size = 0
    total_after_size = 0
    num_images = 0

    extensions = ('.png', '.jpg', '.jpeg')
    if not skip_webp:
        extensions = extensions + ('.webp',)

    for filename in os.listdir(directory):
        if filename.lower().endswith(extensions):
            num_images += 1
            img_path = os.path.join(directory, filename)
            before_size = os.path.getsize(img_path)
            total_before_size += before_size
            process_image(img_path, directory, max_width, max_height)
            new_filename = filename.rsplit('.', 1)[0] + '.webp'
            new_path = os.path.join(directory, new_filename)
            after_size = os.path.getsize(new_path)
            total_after_size += after_size

    if num_images > 0:
        avg_reduction = int((total_after_size / total_before_size) * 100)
        total_before_mb = total_before_size / (1024 * 1024)
        total_after_mb = total_after_size / (1024 * 1024)
        print(f'\n--------------\nTotal Before: {total_before_mb:.2f} MB, Total After: {total_after_mb:.2f} MB')
        print(f'Average Size Reduction: {100 - avg_reduction}%')
        print(f'Total Images Processed: {num_images}')

def adapt_bg_directory(directory: str) -> None:
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            img_path = os.path.join(directory, filename)
            with Image.open(img_path) as img:
                img = add_transparent_border(img)
                img = add_background(img)
                img.save(img_path)

def resize_images_in_md(md_path: str, public_path: str, default_width: int) -> None: # TODO: keep alt text
    # Read the markdown file content
    with open(md_path, 'r', encoding='utf-8') as file:
        updated_content = md_content = file.read()

    # Regex to find image tags and their current width if specified

    for match in re.finditer(r'<img src="\/?([^"]+)"(?: width="(\d+)px")\/>', md_content):

        full_tag = match.string[match.start():match.end()]
        img_src, specified_width = match.groups()

        width = int(specified_width) if specified_width else default_width
        img_path = os.path.join(public_path, img_src)

        # Resize the image
        if os.path.exists(img_path):
            with Image.open(img_path) as img:
                if img.width > width:
                    # Calculate the new dimensions maintaining the aspect ratio
                    height = int((width / img.width) * img.height)
                    img = img.resize((width, height), Image.LANCZOS)

                    # Save the resized image, overwriting the existing one
                    img.save(img_path)
                    print(f'Resized {img_src} to {width}px wide.')

            # Update Markdown content by removing the width attribute
            new_tag = f'<img src="/{img_src}"/>'
            updated_content = updated_content.replace(full_tag, new_tag)
        else:
            print(f"Image not found: {img_path}")

        # Rewrite the markdown file without width attributes
        with open(md_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)


if __name__ == '__main__':
    for dir in os.listdir('public/articles/'):
        if os.path.isdir(f'public/articles/{dir}'):
            resize_and_convert_directory(f'public/articles/{dir}', 1010, 1010, skip_webp=False)
