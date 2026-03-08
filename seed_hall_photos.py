from cinema.models import MovieHall, HallPhoto

HALL_PHOTOS = {
    'Hall Alpha': [
        'halls/hall1/hall1.webp',
        'halls/hall1/hall1_2.webp',
        'halls/hall1/hall1_3.webp',
        'halls/hall1/hall2_4.webp',
    ],
    'Hall Gamma': [
        'halls/hall3/hall3_1.webp',
        'halls/hall3/hall3_2.webp',
        'halls/hall3/hall3_3.webp',
        'halls/hall3/hall3_4.webp',
        'halls/hall3/hall3_5.webp',
    ],
}

for hall_name, paths in HALL_PHOTOS.items():
    try:
        hall = MovieHall.objects.get(name=hall_name)
    except MovieHall.DoesNotExist:
        print(f'Skipped (hall not found): {hall_name}')
        continue
    for order, path in enumerate(paths):
        if not HallPhoto.objects.filter(hall=hall, image=path).exists():
            HallPhoto.objects.create(hall=hall, image=path, order=order)
            print(f'Created: {hall_name} -> {path}')
        else:
            print(f'Skipped (exists): {hall_name} -> {path}')

print('Done.')
