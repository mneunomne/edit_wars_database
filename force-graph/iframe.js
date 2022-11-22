
function autoRotate (node_id) {
  document.querySelector('iframe').contentWindow.postMessage({ function: "autoRotate",},"*")
}

function focusOnNode (node_id) {
  document.querySelector('iframe').contentWindow.postMessage(
    {
      function: "focusOnNode",
      data: node_id,
    },
    "*"
  );
}
