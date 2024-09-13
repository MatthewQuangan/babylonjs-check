import { getGPUTier, TierResult } from 'detect-gpu';
import { InfoCard } from 'InfoCard';
import { useEffect, useState } from 'react';
import { UAParser, UAParserExt } from 'ua-parser-js';

const MUJIN_DEVICES_UA_EXT: UAParserExt = {
  device: [
    [/(Mujin)\/[\d.]+ \((pendant|hmi)\w+\)/],
    [UAParser.DEVICE.VENDOR, UAParser.DEVICE.MODEL],
  ],
};

export const Hardware = () => {
  const [gpuTier, setGpuTier] = useState<TierResult>();

  useEffect(() => {
    (async () => {
      const tierResult = await getGPUTier();
      setGpuTier(tierResult);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uaParser = new UAParser(MUJIN_DEVICES_UA_EXT);

  const ua = uaParser.setUA(window.navigator.userAgent).getResult();

  return (
    <div className="container">
      <p>Hardware</p>
      <div className="instrumentation">
        <InfoCard
          title="browser"
          items={[
            {
              label: 'Name',
              value: ua.browser.name,
            },
            {
              label: 'Version',
              value: ua.browser.version,
            },
            {
              label: 'Engine',
              value: ua.engine.name,
            },
          ]}
        />
        <InfoCard
          title="OS"
          items={[
            {
              label: 'Name',
              value: ua.os.name,
            },
            {
              label: 'Version',
              value: ua.os.version,
            },
          ]}
        />
        <InfoCard
          title="Device"
          items={[
            {
              label: 'Vendor',
              value: ua.device.vendor,
            },
            {
              label: 'Modal',
              value: ua.device.model,
            },
            {
              label: 'Type',
              value: ua.device.type,
            },
          ]}
        />

        <InfoCard
          title="CPU"
          items={[
            {
              label: 'architecture',
              value: ua.cpu.architecture,
            },
          ]}
        />

        <InfoCard
          title="GTP"
          items={[
            {
              label: 'model',
              value: gpuTier?.gpu,
            },
            {
              label: 'tier',
              value: gpuTier?.tier,
            },
          ]}
        />
      </div>
    </div>
  );
};
