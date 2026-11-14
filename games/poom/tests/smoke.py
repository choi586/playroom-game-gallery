"""품 스모크 테스트: 세 편을 엔딩까지 자동 플레이하고, 저장·이어하기·교사용 건너뛰기·주사율 보정을 확인한다."""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'
PLAN = [[(112,146),(528,146),(400,308)],[(122,304),(400,308),(518,304)],[(112,146),(400,308),(122,304)],[(518,304),(400,308),(528,146)]]
errs = []
async def play(b, k, vp, mob, shot=None):
    pg = await b.new_page(viewport=vp, device_scale_factor=2, is_mobile=mob, has_touch=mob)
    pg.on('pageerror', lambda e: errs.append(f'{k}: {e}'))
    await pg.goto(URL); await pg.wait_for_selector('.box .btn')
    await pg.evaluate(f"start('{k}')"); await pg.click('#ob'); await pg.wait_for_timeout(200); await pg.click('#ob')
    bb = await pg.locator('#c').bounding_box()
    async def tap(lx, ly):
        px, py = bb['x']+bb['width']*lx/640, bb['y']+bb['height']*ly/400
        await (pg.touchscreen.tap(px, py) if mob else pg.mouse.click(px, py))
    async def dlg():
        await pg.wait_for_selector('#dlg:not(.hide)', timeout=12000); await pg.click('#dlg'); await pg.wait_for_timeout(150)
    for d, day in enumerate(PLAN):
        for (ax, ay) in day:
            await tap(ax, ay); await dlg()
        await tap(320, 202); await pg.wait_for_selector('#ob', timeout=12000)
        if d < 3:
            await pg.click('#ob'); await pg.wait_for_timeout(300)
            await pg.click('.box .btn'); await dlg()
    saved = await pg.evaluate("JSON.parse(localStorage.getItem('poom-save-v1')).S.day")
    assert saved == 3, saved
    await pg.click('#ob')
    for _ in range(3):
        await pg.wait_for_selector('#ob', timeout=15000)
        if await pg.evaluate("document.getElementById('ob').textContent") == '처음으로': break
        await pg.click('#ob')
    r = await pg.evaluate("[S.heard.length,S.ch.length,S.came.length,localStorage.getItem('poom-save-v1')]")
    assert r[0] == 8 and r[1] == 3 and r[2] == 4 and r[3] is None, r
    assert '들은 이야기 8/12' in await pg.evaluate("resultText()")
    if shot: await pg.screenshot(path=shot)
    await pg.close(); print('ok', k, r)
async def extras(b):
    pg = await b.new_page(viewport={'width':900,'height':640}); pg.on('pageerror', lambda e: errs.append(f'extra: {e}'))
    await pg.goto(URL); await pg.wait_for_selector('.box .btn')
    # 이어하기
    await pg.evaluate("start('oki')"); await pg.click('#ob'); await pg.wait_for_timeout(200)
    await pg.evaluate("S.day=2;S.food=5;save()"); await pg.reload(); await pg.wait_for_selector('.box .btn')
    assert '이어서 하기' in await pg.inner_text('#box')
    await pg.evaluate("resume()"); assert await pg.evaluate("[SC.key,S.day,S.food]") == ['oki',2,5]
    # 교사용 건너뛰기
    await pg.goto(URL+'#teacher'); await pg.reload(); await pg.wait_for_selector('.box .btn')
    assert '교사용' in await pg.inner_text('#box')
    await pg.evaluate("skip('tw')"); assert await pg.evaluate("[mode,S.came.length]") == ['storm',4]
    # 주사율 보정: 1초 동안 진행된 논리 프레임이 60 안팎인지
    t0 = await pg.evaluate("t"); await pg.wait_for_timeout(1000); dt = (await pg.evaluate("t")) - t0
    assert 45 <= dt <= 70, dt
    # 형식이 틀린 시나리오는 거부
    await pg.evaluate("POOM.add({key:'bad',theme:'jeju'})"); assert await pg.evaluate("POOM.errors.length==1&&!SCS.bad")
    await pg.close(); print('ok extras, frames/sec', dt)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await play(b, 'jeju', {'width':900,'height':640}, False, '/tmp/end.png')
        await play(b, 'oki', {'width':844,'height':390}, True)
        await play(b, 'tw', {'width':390,'height':844}, True)
        await extras(b); await b.close()
    print('ERRORS', errs) if errs else print('ALL PASS'); sys.exit(1 if errs else 0)
asyncio.run(main())
