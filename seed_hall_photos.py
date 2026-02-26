from cinema.models import MovieHall, HallPhoto

prefixes = ['alpha', 'beta', 'gamma']
halls = list(MovieHall.objects.order_by('name'))

for i, hall in enumerate(halls):
    prefix = prefixes[i] if i < len(prefixes) else f'hall{i+1}'
    for order, suffix in enumerate(['1', '2']):
        path = f'halls/{prefix}_{suffix}.webp'
        if not HallPhoto.objects.filter(hall=hall, image=path).exists():
            HallPhoto.objects.create(hall=hall, image=path, order=order)
            print(f'Created: {hall.name} -> {path}')
        else:
            print(f'Skipped (exists): {hall.name} -> {path}')

print('Done.')
