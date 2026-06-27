import { createApp } from './app';
import { seed } from './store';

const PORT = Number(process.env.PORT ?? 3000);
seed();
createApp().listen(PORT, () => {
  console.log(`URL shortener listening on http://localhost:${PORT}`);
});
