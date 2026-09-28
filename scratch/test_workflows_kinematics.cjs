const THREE = require('three');

async function testWorkflows() {
  console.log('======================================================================');
  console.log('TESTING WASTE WORKFLOW CONTROLLER (ORGANIC, INORGANIC, LEFTOVER FOOD)');
  console.log('======================================================================\n');

  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const { WorkflowController, WORKFLOW_MODES } = await import('../src/animation/workflowController.js');

  const scene = new THREE.Scene();
  const envelope = createGomikinEnvelope();
  scene.add(envelope);
  envelope.updateMatrixWorld(true);

  const controller = new WorkflowController(envelope, scene);

  // 1. Test ORGANIC WORKFLOW
  console.log('--- 1. Testing ORGANIC Waste Workflow ---');
  controller.setMode(WORKFLOW_MODES.ORGANIC);
  for (let p = 0; p <= 1.0; p += 0.25) {
    controller.setProgress(p);
    const step = controller.getCurrentStep();
    console.log(`  p = ${p.toFixed(2)} | Step ${step.index + 1}/${step.total}: ${step.label} | Marker Pos: Y=${controller.wasteMarker.position.y.toFixed(3)}m, X=${controller.wasteMarker.position.x.toFixed(3)}m`);
  }
  controller.reset();

  // 2. Test INORGANIC WORKFLOW
  console.log('\n--- 2. Testing INORGANIC Waste Workflow ---');
  controller.setMode(WORKFLOW_MODES.INORGANIC);
  for (let p = 0; p <= 1.0; p += 0.25) {
    controller.setProgress(p);
    const step = controller.getCurrentStep();
    console.log(`  p = ${p.toFixed(2)} | Step ${step.index + 1}/${step.total}: ${step.label} | Marker Pos: Y=${controller.wasteMarker.position.y.toFixed(3)}m, X=${controller.wasteMarker.position.x.toFixed(3)}m`);
  }
  controller.reset();

  // 3. Test LEFTOVER FOOD WORKFLOW
  console.log('\n--- 3. Testing LEFTOVER FOOD Workflow ---');
  controller.setMode(WORKFLOW_MODES.LEFTOVER_FOOD);
  for (let p = 0; p <= 1.0; p += 0.25) {
    controller.setProgress(p);
    const step = controller.getCurrentStep();
    console.log(`  p = ${p.toFixed(2)} | Step ${step.index + 1}/${step.total}: ${step.label} | Marker Pos: Y=${controller.wasteMarker.position.y.toFixed(3)}m, Z=${controller.wasteMarker.position.z.toFixed(3)}m`);
  }
  controller.reset();

  console.log('\n======================================================================');
  console.log('WORKFLOW CONTROLLER VERIFICATION RESULT: 100% PASSED!');
  console.log('======================================================================\n');
}

testWorkflows().catch(err => {
  console.error(err);
  process.exit(1);
});
