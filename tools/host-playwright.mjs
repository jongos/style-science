// Optional test facade. Reuses an explicit host installation; never downloads one.
if(!process.env.PLAYWRIGHT_MODULE || !process.env.PLAYWRIGHT_EXECUTABLE_PATH) throw Error('Set PLAYWRIGHT_MODULE and PLAYWRIGHT_EXECUTABLE_PATH to existing host tools');
const host=await import(process.env.PLAYWRIGHT_MODULE);
export const chromium={launch:options=>host.chromium.launch({...options,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH})};
