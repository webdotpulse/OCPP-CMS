import { RPCClient } from 'ocpp-rpc';

const client = new RPCClient({
  endpoint: 'ws://localhost:9220/OCPP/1.6/Sim-1',
  identity: 'Sim-1',
  protocols: ['ocpp1.6'],
  strictMode: false,
});

async function run() {
  await client.connect();
  console.log('Connected');
  const response = await client.call('BootNotification', {
    chargePointVendor: 'Simulator',
    chargePointModel: 'Sim AC',
  });
  console.log('BootNotification response:', response);
  client.disconnect();
}
run().catch(console.error);
