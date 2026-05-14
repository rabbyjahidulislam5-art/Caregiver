async function deploy() {
  const token = 'rnd_SvwYcoXsW4FxAfh65NpPvYp2Ax7A';
  
  try {
    console.log('Fetching owner ID...');
    const userRes = await fetch('https://api.render.com/v1/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Sometimes owner id comes from /v1/owners
    const ownersRes = await fetch('https://api.render.com/v1/owners', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    
    if (!ownersRes.ok) {
        throw new Error('Failed to fetch owners');
    }
    const ownersData = await ownersRes.json();
    const ownerId = ownersData[0].owner.id;
    console.log('Owner ID:', ownerId);

    const payload = {
      type: "web_service",
      name: "caregiver-modern-api",
      ownerId: ownerId,
      repo: "https://github.com/rabbyjahidulislam5-art/Caregiver",
      branch: "main",
      rootDir: "backend",
      autoDeploy: "yes",
      envVars: [
        {
          key: "DATABASE_URL",
          value: "postgresql://neondb_owner:npg_HtbX9fGae3NB@ep-autumn-sunset-apes7o9s-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        },
        {
          key: "NODE_ENV",
          value: "production"
        }
      ],
      serviceDetails: {
        env: "node",
        envSpecificDetails: {
            buildCommand: "npm install && npx prisma generate && npx tsc",
            startCommand: "node dist/index.js"
        },
        plan: "free"
      }
    };

    console.log('Creating service...');
    const createRes = await fetch('https://api.render.com/v1/services', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const createData = await createRes.json();
    console.log('Response:', createData);
  } catch (error) {
    console.error('Error:', error);
  }
}

deploy();
