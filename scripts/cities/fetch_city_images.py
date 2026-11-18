#!/usr/bin/env python3
"""Fetch city card photos and icons from Wikimedia Commons (runs in GitHub Actions).

Reads data-sources/city-images.json. For each city:
  card -> public/images/<path>/opengraph-image.jpg, centre-cropped to 1280x853 (3:2)
  icon -> public/images/<path>/icon.ico, the file rendered at 512 px, padded square
Existing files are replaced only with --force. Author and licence of every file are
recorded in public/images/CREDITS.md, and src/lib/cityAssetManifest.json is updated.
"""
import hashlib, io, json, os, sys, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'MetroMemoryImageFetcher/1.0 (https://github.com/kirklandwaterbot/metro-memory)'}
FORCE = '--force' in sys.argv


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def info(title, width):
    q = {'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'titles': title,
         'iiprop': 'url|extmetadata', 'iiurlwidth': str(width)}
    pages = json.loads(get(API + '?' + urllib.parse.urlencode(q)))['query']['pages']
    page = next(iter(pages.values()))
    if 'imageinfo' not in page:
        raise SystemExit(f'not found on Commons: {title}')
    ii = page['imageinfo'][0]
    meta = ii.get('extmetadata', {})
    strip = lambda s: __import__('re').sub(r'<[^>]+>', '', s or '').strip()
    return {
        'url': ii.get('thumburl') or ii['url'],
        'page': ii['descriptionurl'],
        'author': strip(meta.get('Artist', {}).get('value')) or 'unknown',
        'license': strip(meta.get('LicenseShortName', {}).get('value')) or 'see file page',
    }


def save_card(title, out):
    i = info(title, 1920)
    im = Image.open(io.BytesIO(get(i['url']))).convert('RGB')
    w, h = im.size
    target = 3 / 2
    if w / h > target:
        nw = int(h * target); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.resize((1280, 853), Image.LANCZOS).save(out, 'JPEG', quality=86, optimize=True, progressive=True)
    return i


def save_icon(title, out):
    i = info(title, 512)
    im = Image.open(io.BytesIO(get(i['url']))).convert('RGBA')
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    side = max(im.size)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    sq.resize((512, 512), Image.LANCZOS).save(out, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    return i


def sha12(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()[:12]


def main():
    spec = json.load(open(os.path.join(ROOT, 'data-sources', 'city-images.json')))
    manifest_path = os.path.join(ROOT, 'src', 'lib', 'cityAssetManifest.json')
    manifest = json.load(open(manifest_path))
    credits_path = os.path.join(ROOT, 'public', 'images', 'CREDITS.md')
    credits = open(credits_path).read() if os.path.exists(credits_path) else '# Image credits\n\nCity images from Wikimedia Commons.\n'
    for c in spec['cities']:
        d = os.path.join(ROOT, 'public', 'images', c['path'])
        os.makedirs(d, exist_ok=True)
        entry = manifest.setdefault(c['slug'], {})
        for kind, fn, saver in (('card', 'opengraph-image.jpg', save_card), ('icon', 'icon.ico', save_icon)):
            title = c.get(kind)
            out = os.path.join(d, fn)
            if not title or (os.path.exists(out) and not FORCE):
                continue
            i = saver(title, out)
            line = f"- `{c['path']}/{fn}`: [{title[5:]}]({i['page']}) by {i['author']}, {i['license']}\n"
            credits = '\n'.join(l for l in credits.split('\n') if f"`{c['path']}/{fn}`" not in l)
            credits = credits.rstrip('\n') + '\n' + line
            print('saved', c['path'], fn, '-', i['author'], i['license'])
        icon, card = os.path.join(d, 'icon.ico'), os.path.join(d, 'opengraph-image.jpg')
        if os.path.exists(icon):
            entry.update({'icon': True, 'iconVersion': sha12(icon)})
        if os.path.exists(card):
            entry.update({'openGraphExtension': 'jpg', 'openGraphVersion': sha12(card)})
    manifest = dict(sorted(manifest.items()))
    open(manifest_path, 'w').write(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    open(credits_path, 'w').write(credits)


if __name__ == '__main__':
    main()
