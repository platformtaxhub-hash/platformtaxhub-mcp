import { setGlobalDispatcher, ProxyAgent } from "undici";
if (process.env.HTTPS_PROXY || process.env.https_proxy) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY || process.env.https_proxy));
}
