async function init() {
  let shape = "iks";
  let id = new URLSearchParams(window.location.search).get("id");
  if (id) {
    const { data, error } = await client
      .from('tactical_iks_oks')
      .select('*')
      .eq('id', id)
    onUpdateAndReload(data[0], id);
    document.querySelector("#shape").classList.add(sessionStorage.getItem(id));
    let gameURL= document.createElement("div");
    gameURL.setAttribute("id","gameURL");
    gameURL.innerHTML = `KOD: <input type="text" readonly="true" value="${id}" size="${id.length}" style="text-align:center;">`;
    document.querySelector("body").append(gameURL);
  }
  else {
    let gameMenu = document.createElement("div");
    gameMenu.setAttribute("id", "create-game-div");
    gameMenu.innerHTML = `
    <button id="join-game" style="width:33%;margin-left:var(--board-margin);" onclick="joinGame();">pridruži se partiji</button>
    <input  id="game-id" type="text" style="width:34%;">
    <button id=" create-game" style="width:33%;margin-right:var(--board-margin);" onclick="createGame();">napravi partiju</button>`;
    document.querySelector("body").append(gameMenu);
    document.querySelector("body").classList.add("offline");
    let squares = document.querySelectorAll(".big-square");
    for (let i = 0; i < squares.length; i++) {
      squares[i].classList.add("iks-turn");
      squares[i].classList.add("active");
    }
    setInputFilter(document.querySelector("#game-id"), function (value) {
      return /^\d*$/.test(value);
    }, "Dozvojleni su samo brojevi");
  }
  let smallSquares = document.querySelectorAll(".small-square");
  for (let i = 0; i < smallSquares.length; i++)
    smallSquares[i].addEventListener("click", async function clickHandler() {
      if (smallSquares[i].parentElement.classList.contains("active") && !smallSquares[i].classList.contains("iks") && !smallSquares[i].classList.contains("oks")) {
        if (id) {
          smallSquares[i].classList.add(sessionStorage.getItem(id));
          fillSquare(smallSquares[i]);
          fillSquare(smallSquares[i].parentElement);
          smallSquares[i].removeEventListener("click", clickHandler);
          resetSquares();
          let turn = changeTurn(sessionStorage.getItem(id));
          nextSquares(smallSquares[i], turn, false);
          let position = getPosition(document.querySelectorAll(".small-square"));
          position += " " + getPosition(document.querySelectorAll(".big-square"));
          const { error } = await client
            .from('tactical_iks_oks')
            .update({ position: position, turn: turn })
            .eq('id', id)
        }
        else {
          smallSquares[i].classList.add(shape);
          fillSquare(smallSquares[i]);
          fillSquare(smallSquares[i].parentElement);
          smallSquares[i].removeEventListener("click", clickHandler);
          resetSquares();
          shape = changeTurn(shape);
          nextSquares(smallSquares[i], shape, true);
        }
      }
    });
}
init();
async function onUpdateAndReload(data) {
  if (!sessionStorage.getItem(data.id) && data.empty_shape != "") {
    sessionStorage.setItem(data.id, data.empty_shape);
    const { error } = await client
      .from('tactical_iks_oks')
      .update({ empty_shape: "" })
      .eq('id', data.id)
  }
  setPosition(data.position.split(" ")[0], document.querySelectorAll(".small-square"));
  setPosition(data.position.split(" ")[1], document.querySelectorAll(".big-square"));
  if (data.turn === sessionStorage.getItem(data.id)) {
    let squares = document.querySelectorAll(".big-square." + data.turn + "-turn");
    for (let i = 0; i < squares.length; i++) {
      squares[i].classList.add("active");
    }
  }

  fillSquare(document.querySelector(".big-square"));
  let board = document.querySelector("#board");
  if (sessionStorage.getItem(data.id) && sessionStorage.getItem(data.id) !== "" && (board.classList.contains("iks") || board.classList.contains("oks") || document.querySelectorAll(".big-square.iks , .big-square-oks").length === 9)) {
    let gameOverScreen = document.createElement("div");
    gameOverScreen.setAttribute("id", "game-over-div");
    gameOverScreen.innerHTML = `
    <div id="game-over-menu">
      <div id="game-over-text"></div>
      <div id="game-over-buttons">
        <button id="go-back" onclick="goBack();">nazad</button>
        <button id="rematch" onclick="rematch();">revanš</button>
      </div>
    </div>`;
    document.querySelector("body").append(gameOverScreen);
    if (document.querySelectorAll(".big-square.iks , .big-square-oks").length === 9) document.querySelector("#game-over-text").innerHTML = `<p class="draw-text">NEREŠENO</p>`;
    else if (board.classList.contains("iks")) document.querySelector("#game-over-text").innerHTML = `<p class="iks-text">POBEDIO JE IKS</p>`;
    else if (board.classList.contains("oks")) document.querySelector("#game-over-text").innerHTML = `<p class="oks-text">POBEDIO JE OKS</p>`;
  }
}
function resetSquares() {
  let bigSquares = document.querySelectorAll(".big-square");
  for (let i = 0; i < bigSquares.length; i++) {
    bigSquares[i].classList.remove("iks-turn");
    bigSquares[i].classList.remove("oks-turn");
    bigSquares[i].classList.remove("active");
  }
}
function fillSquare(square) {
  let squares = square.parentElement.children;

  sameShape(squares[0], squares[1], squares[2], square.parentElement);
  sameShape(squares[3], squares[4], squares[5], square.parentElement);
  sameShape(squares[6], squares[7], squares[8], square.parentElement);
  sameShape(squares[0], squares[3], squares[6], square.parentElement);
  sameShape(squares[1], squares[4], squares[7], square.parentElement);
  sameShape(squares[2], squares[5], squares[8], square.parentElement);
  sameShape(squares[0], squares[4], squares[8], square.parentElement);
  sameShape(squares[6], squares[4], squares[2], square.parentElement);
}
function sameShape(square1, square2, square3, parent) {
  if (square1.classList.contains("iks") && square2.classList.contains("iks") && square3.classList.contains("iks")) parent.classList.add("iks");
  if (square1.classList.contains("oks") && square2.classList.contains("oks") && square3.classList.contains("oks")) parent.classList.add("oks");
}
function changeTurn(turn) {
  return turn === "iks" ? "oks" : "iks";
}
function nextSquares(smallSquare, turn, activate) {
  let bigSquare;
  if (smallSquare.classList.contains("top-left"))
    bigSquare = document.querySelector(".big-square.top-left");
  else if (smallSquare.classList.contains("top-middle"))
    bigSquare = document.querySelector(".big-square.top-middle");
  else if (smallSquare.classList.contains("top-right"))
    bigSquare = document.querySelector(".big-square.top-right");
  else if (smallSquare.classList.contains("middle-left"))
    bigSquare = document.querySelector(".big-square.middle-left");
  else if (smallSquare.classList.contains("middle"))
    bigSquare = document.querySelector(".big-square.middle");
  else if (smallSquare.classList.contains("middle-right"))
    bigSquare = document.querySelector(".big-square.middle-right");
  else if (smallSquare.classList.contains("bottom-left"))
    bigSquare = document.querySelector(".big-square.bottom-left");
  else if (smallSquare.classList.contains("bottom-middle"))
    bigSquare = document.querySelector(".big-square.bottom-middle");
  else bigSquare = document.querySelector(".big-square.bottom-right");
  if (
    bigSquare.classList.contains("iks") ||
    bigSquare.classList.contains("oks")
  )
    selectAllEmptySquares(turn, activate);
  else selectSquare(bigSquare, turn, activate);
}
function selectAllEmptySquares(turn, activate) {
  let bigSquares = document.querySelectorAll(".big-square:not(.iks , .oks)");
  for (let i = 0; i < bigSquares.length; i++) selectSquare(bigSquares[i], turn, activate);
}
function selectSquare(square, turn, activate) {
  square.classList.add(turn + "-turn");
  if (activate) square.classList.add("active");
}
function getPosition(squares) {
  let position = "";
  for (let i = 0; i < squares.length; i++) {
    if (squares[i].classList.contains("iks")) position += "1";
    else if (squares[i].classList.contains("oks")) position += "2";
    else if (squares[i].classList.contains("iks-turn")) position += "3";
    else if (squares[i].classList.contains("oks-turn")) position += "4";
    else position += "0";
  }
  return position;
}
function setPosition(position, squares) {
  resetSquares();
  for (let i = 0; i < squares.length; i++) {
    if (position[i] === "1") squares[i].classList.add("iks");
    else if (position[i] === "2") squares[i].classList.add("oks");
    else if (position[i] === "3") squares[i].classList.add("iks-turn");
    else if (position[i] === "4") squares[i].classList.add("oks-turn");
  }
}
function setInputFilter(textbox, inputFilter, errMsg) {
  ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop", "focusout"].forEach(function (event) {
    textbox.addEventListener(event, function (e) {
      if (inputFilter(this.value)) {
        if (["keydown", "mousedown", "focusout"].indexOf(e.type) >= 0) {
          this.classList.remove("input-error");
          this.setCustomValidity("");
        }

        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      }
      else if (this.hasOwnProperty("oldValue")) {
        this.classList.add("input-error");
        this.setCustomValidity(errMsg);
        this.reportValidity();
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      }
      else {
        this.value = "";
      }
    });
  });
}

async function createGame() {
  let startShape = "oks";
  if (Boolean(Math.round(Math.random()))) startShape = "iks";
  let id = document.querySelector("#game-id").value;
  if (id !== "") {
    try {
      const { data, error } = await client
        .from('tactical_iks_oks')
        .insert([
          { id: parseInt(id), empty_shape: changeTurn(startShape) },
        ])
        .select()

      loadNewGame(data[0], startShape);
    }
    catch {
      document.querySelector("#game-id").classList.add("input-error");
    }
  }
  else {
    const { data, error } = await client
      .from('tactical_iks_oks')
      .insert([
        { empty_shape: changeTurn(startShape) },
      ])
      .select()
    loadNewGame(data[0], startShape);
  }
}
function loadNewGame(data, startShape) {
  sessionStorage.setItem(data.id, startShape);
  let url = new URL(window.location.href);
  url.searchParams.set("id", data.id);
  window.location.href = url;
}
async function joinGame() {
  let id = document.querySelector("#game-id").value;
  if (id !== "") {
    const { count, error } = await client
      .from('tactical_iks_oks')
      .select('id', { count: 'exact', head: true })
      .eq('id', parseInt(id))
    if (count > 0) {
      let url = new URL(window.location.href);
      url.searchParams.set("id", id);
      window.location.href = url;
    }
    else document.querySelector("#game-id").classList.add("input-error");
  }
}
async function goBack() {
  await client
    .from('tactical_iks_oks')
    .delete()
    .eq({ 'id': parseInt(new URLSearchParams(window.location.search).get("id")) });
  window.location.href = window.location.href.split('?')[0];
}
async function rematch() {
  fillSquare(document.querySelector(".big-square"));
  let board = document.querySelector("#board");
  if (sessionStorage.getItem(new URLSearchParams(window.location.search).get("id")) && sessionStorage.getItem(new URLSearchParams(window.location.search).get("id")) !== "" && (board.classList.contains("iks") || board.classList.contains("oks") || document.querySelectorAll(".big-square.iks , .big-square-oks").length === 9)) {
    const { error } = await client
      .from('tactical_iks_oks')
      .update({ position: "000000000000000000000000000000000000000000000000000000000000000000000000000000000 333333333", turn: "iks", created_at: new Date().toISOString() })
      .eq('id', new URLSearchParams(window.location.search).get("id"))
  }
  document.querySelector("#game-over-div").remove();
  sessionStorage.setItem(new URLSearchParams(window.location.search).get("id"), changeTurn(sessionStorage.getItem(new URLSearchParams(window.location.search).get("id"))));
  window.location.href = window.location.href;
}
const channel = client
  .channel('value-db-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tactical_iks_oks',
      filter: 'id=eq.' + new URLSearchParams(window.location.search).get("id"),
    },
    (payload) => onUpdateAndReload(payload.new)
  )
  .subscribe()