import { JVBowl } from "./core/bowl.js";

function main() {
  const bowl = new JVBowl(document.getElementById("bowl"));
  bowl.start();
  bowl.addBox();
  bowl.addBox();
  bowl.addBox();
  // const box = bowl.addBox();
  // setTimeout(() => bowl.disposeBox(box), 1000)
}

main();
