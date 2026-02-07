const photoTests = [
  {
    image: "./dokkai_photo/01.png",
    questions: [
        {
        text: "19",
        options: ["ある", "あった", "あのような", "あんな"],
        correct: 0
        },
        {
        text: "20",
        options: ["今からは", "今までは", "次からは", "次までは"],
        correct: 1
        },
        {
        text: "21",
        options: ["増えていそうだ", "増えてありそうだ", "増えてあるそうだ", "増えているそうだ"],
        correct: 3
        },
        {
        text: "22a/b",
        options: ["a なぜなら / b だから", "a ところが / b がないので", "a たとえば / b など", "a たぶん / b であれば"],
        correct: 2
        },
        {
        text: "23",
        options: ["急に決めた", "急に決まるだろう", "すぐに決められなかった", "すぐに決められないだろう"],
        correct: 3
        },
    ]
    },
    {
    image: "./dokkai_photo/02.png",
    questions: [
        {
        text: "19",
        options: ["なってみると", "なるところに", "なったように", "なるとしたら"],
        correct: 0
        },
        {
        text: "20",
        options: ["あるくらいだ", "あるかないかわからない", "めったにない", "あるはずがないのだ"],
        correct: 0
        },
        {
        text: "21a/b",
        options: ["a きらいだから / b 食べないようにしている", "a きらいだから / b 食べるようにしている", "a 好きだから / b 食べるようにしている", "a 好きだから / b 食べないようにしている"],
        correct: 0
        },
        {
        text: "22",
        options: ["どんなふうに", "あんなふうな", "どんなような", "そんなふうに"],
        correct: 3
        },
        {
        text: "23",
        options: ["または", "そして", "ところが", "つまり"],
        correct: 1
        },
    ]
    },
    {
    image: "./dokkai_photo/03.png",
    questions: [
        {
        text: "19a/b",
        options: ["a からして / b 表すことだ", "a によると / b 表しているそうだ", "a にしろ / b 表すものだ", "a にかかわらず / b 表したわけだ"],
        correct: 1
        },
        {
        text: "20",
        options: ["感じようとする", "感じがちな", "感じさせる", "感じないでもない"],
        correct: 2
        },
        {
        text: "21",
        options: ["にともなって", "につれて", "に対して", "において"],
        correct: 3
        },
        {
        text: "22",
        options: ["新しいキャラクター", "人気があるキャラクター", "市町村のキャラクター", "このマークのキャラクター"],
        correct: 1
        },
        {
        text: "23",
        options: ["つけてほしい", "つけられてほしい", "つけてもいい", "つけてみたい"],
        correct: 0
        },
    ]
    },
    {
    image: "./dokkai_photo/04.png",
    questions: [
        {
        text: "19",
        options: ["あるのではないだろうか", "ないのではないだろうか", "なくてもよいのだろうか", "あってもよいのだろうか"],
        correct: 0
        },
        {
        text: "20",
        options: ["乗れば乗るほど", "乗ったとたん", "乗ったすえに", "乗ったばかりに"],
        correct: 1
        },
        {
        text: "21",
        options: ["または", "しかも", "ところが", "たとえば"],
        correct: 2
        },
        {
        text: "22",
        options: ["このことからはわからないが", "このことが言うには", "このことでよければ", "このことが示す通り"],
        correct: 3
        },
        {
        text: "23",
        options: ["すればいい", "しなくてもいい", "してもいい", "したほうがいい"],
        correct: 1
        },
    ]
    },
    {
    image: "./dokkai_photo/05.png",
    questions: [
        {
        text: "19",
        options: ["からすると", "に限らず", "に限り", "からして"],
        correct: 1
        },
        {
        text: "20a/b",
        options: ["a ばかりに / b 理解できなくなりました", "a せいで / b 理解することができます", "a おかげで / b 理解できるようになりました", "a からには / b 理解しようと思います"],
        correct: 2
        },
        {
        text: "21",
        options: ["考えられません", "考えません", "考えさせられません", "考えさせません"],
        correct: 0
        },
        {
        text: "22",
        options: ["なかなか", "とうとう", "だんだん", "ますます"],
        correct: 1
        },
        {
        text: "23",
        options: ["過去の新聞を見る", "現在の新聞を見る", "過去の新聞を保存する", "現在の新聞を保存する"],
        correct: 0
        },
    ]
    },
    {
    image: "./dokkai_photo/06.png",
    questions: [
        {
        text: "19",
        options: ["ですから", "または", "なぜなら", "ただし"],
        correct: 0
        },
        {
        text: "20",
        options: ["あの", "このような", "ああした", "それほどの"],
        correct: 1
        },
        {
        text: "21a/b",
        options: ["a まずは / b 最初に", "a まずは / b 最後に", "a 最初に / b まずは", "a 最後に / b まずは"],
        correct: 2
        },
        {
        text: "22",
        options: ["慣れつつあります", "慣れてつつあります", "慣れてつついます", "慣れつついます"],
        correct: 0
        },
        {
        text: "23",
        options: ["限りでしょうか", "どころでしょうか", "上でしょうか", "ことでしょうか"],
        correct: 3
        },
    ]
    },
    {
    image: "./dokkai_photo/07.png",
    questions: [
        {
        text: "19",
        options: ["もの", "しか", "さえ", "すら"],
        correct: 0
        },
        {
        text: "20a/b",
        options: ["a もしも / b だろう", "a もしかすると / b かもしれない", "a もし / b だったのだ", "a もしかしたら / b だということだ"],
        correct: 1
        },
        {
        text: "21",
        options: ["だからといって", "または", "それとも", "実は"],
        correct: 3
        },
        {
        text: "22",
        options: ["名前が変わっていた", "名前を変えずにいた", "名前を変えた", "名前が変わった"],
        correct: 2
        },
        {
        text: "23",
        options: ["祈っている一方だ", "祈っているにちがいない", "祈りたいにすぎない", "祈りたいものだ"],
        correct: 1
        },
    ]
    },
    {
    image: "./dokkai_photo/08.png",
    questions: [
        {
        text: "19a/b",
        options: ["a からには / b 結論です", "a からといって / b 満足です", "a にもかかわらず / b 現状です", "a ことから / b 感想です"],
        correct: 2
        },
        {
        text: "20",
        options: ["これからの", "あれからの", "こちらからの", "あちらからの"],
        correct: 0
        },
        {
        text: "21",
        options: ["だけであり", "だけでなければ", "だけであれば", "だけでなく"],
        correct: 1
        },
        {
        text: "22",
        options: ["未満の", "方面の", "以降の", "以上の"],
        correct: 2
        },
        {
        text: "23",
        options: ["待たれます", "お待ちでいらっしゃいます", "お待ちくださいます", "お待ちいたしております"],
        correct: 3
        },
    ]
    },
    {
    image: "./dokkai_photo/09.png",
    questions: [
        {
        text: "19",
        options: ["きわめてまれな", "ないこともない", "ときどき見られる", "かなりよくある"],
        correct: 0
        },
        {
        text: "20",
        options: ["ところで", "つまり", "しかし", "それから"],
        correct: 1
        },
        {
        text: "21",
        options: ["というばかりです", "どころではありません", "というわけです", "ものがあります"],
        correct: 2
        },
        {
        text: "22",
        options: ["にとって", "に際して", "につれて", "を通じて"],
        correct: 3
        },
        {
        text: "23",
        options: ["紹介するかのようです", "紹介していきかねません", "紹介するおそれがあるのです", "紹介していくつもりだそうです"],
        correct: 3
        },
    ]
    },
    {
    image: "./dokkai_photo/010.png",
    questions: [
        {
        text: "19",
        options: ["おいしい料理", "すべての料理", "いつもの料理", "まあまあの料理"],
        correct: 0
        },
        {
        text: "20",
        options: ["なぜなら", "そうはいっても", "それだけ", "そのため"],
        correct: 1
        },
        {
        text: "21",
        options: ["するかと思います", "なるかと思います", "あることと思います", "いることと思います"],
        correct: 2
        },
        {
        text: "22",
        options: ["限ります", "限りません", "限るようです", "限りました"],
        correct: 1
        },
        {
        text: "23",
        options: ["するしかないのです", "なるしかないのです", "することはあるのです", "なることさえあるのです"],
        correct: 3
        },
    ]
    },
    {
    image: "./dokkai_photo/011.png",
    questions: [
        {
        text: "19",
        options: ["登れると思うと", "登れと思ったら", "登れたと思ったら", "登れたと思うと"],
        correct: 0
        },
        {
        text: "20",
        options: ["見たいと思いました", "見ることができました", "見ることでした", "見られそうでした"],
        correct: 1
        },
        {
        text: "21",
        options: ["それが", "ところが", "そこで", "ところで"],
        correct: 2
        },
        {
        text: "22a/b",
        options: ["a きたない / b よごれていない", "a きれいな / b よごれていない", "a きたない / b よごれている", "a きれいな / b よごれている"],
        correct: 3
        },
        {
        text: "23",
        options: ["調べようと", "調べるにしたら", "調べたところ", "調べるものの"],
        correct: 2
        },
    ]
    },
    {
    image: "./dokkai_photo/012.png",
    questions: [
        {
        text: "19",
        options: ["存じているだろうか", "ご存じだろうか", "おうかがいしただろうか", "うかがっただろうか"],
        correct: 1
        },
        {
        text: "20",
        options: ["見かけないことはない", "見かけないといってよい", "見かけることなどない", "見かけたものだ"],
        correct: 0
        },
        {
        text: "21",
        options: ["だからといって", "とはいうものの", "要するに", "それどころか"],
        correct: 2
        },
        {
        text: "22a/b",
        options: ["a わざと / b ということになっている", "a わざと / b という気にならない", "a わざわざ / b ということになっている", "a わざわざ / b という気にならない"],
        correct: 3
        },
        {
        text: "23",
        options: ["思わないでもない", "思うことは思う", "思わない", "思う"],
        correct: 2
        },
    ]
    },
    {
    image: "./dokkai_photo/013.png",
    questions: [
        {
        text: "19",
        options: ["よく聞かれる", "よく聞かされる", "よく聞かせる", "よく聞くようにさせる"],
        correct: 1
        },
        {
        text: "20",
        options: ["その後", "だから", "確かに", "すると"],
        correct: 2
        },
        {
        text: "21a/b",
        options: ["a ところが / b にきまっている", "a ところで / b わけである", "a なぜ / b のだろうか", "a なぜなら / b からである"],
        correct: 3
        },
        {
        text: "22",
        options: ["学ばないほうがよいと思う", "学ぶほうがよいと思わない", "学ぶべきだと思う", "学ぶべきではないと思う"],
        correct: 2
        },
        {
        text: "23",
        options: ["いつか役立つ", "ずっと役立たない", "あまり役立たない", "すぐに役立つ"],
        correct: 3
        },
    ]
    },
    {
    image: "./dokkai_photo/014.png",
    questions: [
        {
        text: "19",
        options: ["だから", "けれども", "つまり", "その上"],
        correct: 0
        },
        {
        text: "20",
        options: ["見るからに", "見るだけでも", "見たままで", "見ないまでも"],
        correct: 1
        },
        {
        text: "21",
        options: ["あんなときは", "そちらのときは", "そんなときは", "あちらのときは"],
        correct: 2
        },
        {
        text: "22",
        options: ["十分ではない", "違っている", "違っていない", "十分だ"],
        correct: 3
        },
        {
        text: "23",
        options: ["感じかねない", "感じられるにちがいない", "感じるほかはない", "感じることができかねる"],
        correct: 1
        },
    ]
    },
    {
    image: "./dokkai_photo/015.png",
    questions: [
        {
        text: "19",
        options: ["年齢にもかかわらず", "年齢にかかわらず", "年齢にもかぎらず", "年齢にかぎらず"],
        correct: 1
        },
        {
        text: "20a/b",
        options: ["a 集めるとき / b もらうことができます", "a 集めるとき / b もらいます", "a 集めると / b もらえます", "a 集めると / b もらえるようです"],
        correct: 2
        },
        {
        text: "21",
        options: ["こう", "この", "ああ", "あの"],
        correct: 1
        },
        {
        text: "22",
        options: ["だれかが", "だれかは", "だれでも", "だれにも"],
        correct: 2
        },
        {
        text: "23",
        options: ["よかったでしょうか", "よろしいでしょうか", "どうだったでしょうか", "いかがでしょうか"],
        correct: 3
        },
    ]
    },
  // Добавьте больше блоков photoTests по аналогии
];

let currentIndex = 0;
let score = 0;
let time = 0;
let interval;
let maxTests = photoTests.length;
let selectedTests = [];

document.addEventListener('DOMContentLoaded', () => {
  const configModal = document.getElementById("configModal");
  const startBtn = document.getElementById("startBtn");

  configModal.style.display = "flex"; // Показать модальное окно

  startBtn.addEventListener("click", () => {
    const questionCount = parseInt(document.getElementById("questionCount").value);
    time = parseInt(document.getElementById("testTime").value);

    selectedTests = photoTests.slice(0, questionCount);
    configModal.style.display = "none";
    startTest();
  });

  // ✅ Кнопка キャンセル (отмена теста)
document.getElementById("cancelBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

  // Всплывающее окно подтверждения

function showConfirm(message, callback) {
  const modal = document.getElementById("customConfirm");
  const msgEl = document.getElementById("confirmMessage");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  msgEl.textContent = message;
  modal.style.display = "flex";

  const cleanup = () => {
    modal.style.display = "none";
    yesBtn.onclick = null;
    noBtn.onclick = null;
  };

  yesBtn.onclick = () => {
    cleanup();
    callback(true);
  };

  noBtn.onclick = () => {
    cleanup();
    callback(false);
  };
}

  document.getElementById("backToMenuBtn").addEventListener("click", () => {
        showConfirm("メインメニューに戻りますか。", (result) => {
      if (result) window.location.href = "index.html";
    });
  });

  document.getElementById("finishBtn").addEventListener("click", () => {
        showConfirm("テストを終了しますか。", (result) => {
      if (result) finishTest();
    });
  });
});

// Светлая - тёмная тема

  const themeButton = document.getElementById('toggle-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    themeButton.textContent = '☀️';
  }

  themeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeButton.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });


function startTest() {
  showPhotoTest(currentIndex);
  interval = setInterval(updateTimer, 1000);
}

function showPhotoTest(index) {
  const container = document.getElementById("testContainer");
  container.innerHTML = "";

  const test = selectedTests[index];
  const wrapper = document.createElement("div");
  wrapper.className = "question-set";

  const img = document.createElement("img");
  img.src = test.image;
  wrapper.appendChild(img);

  test.questions.forEach((q, qIndex) => {
    const questionEl = document.createElement("div");
    questionEl.className = "question";
    questionEl.innerHTML = `<p>${q.text}</p>`;

    const answersEl = document.createElement("div");
    answersEl.className = "answers";

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => {
        const isCorrect = optIndex === q.correct;
        if (isCorrect) {
          btn.classList.add("correct");
          score++;
        } else {
          btn.classList.add("incorrect");
          answersEl.children[q.correct].classList.add("correct");
        }
        [...answersEl.children].forEach(b => b.disabled = true);
      };
      answersEl.appendChild(btn);
    });

    questionEl.appendChild(answersEl);
    wrapper.appendChild(questionEl);
  });

  container.appendChild(wrapper);

  if (currentIndex < selectedTests.length - 1) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "bottom-button";
    nextBtn.textContent = "進む ▶";
    nextBtn.style.marginTop = "10px";
    nextBtn.onclick = () => {
      currentIndex++;
      showPhotoTest(currentIndex);
    };
    container.appendChild(nextBtn);
  }
}

function updateTimer() {
  if (time <= 0) {
    clearInterval(interval);
    finishTest();
    return;
  }
  time--;
  const minutes = String(Math.floor(time / 60)).padStart(2, '0');
  const seconds = String(time % 60).padStart(2, '0');
  document.getElementById("timer").textContent = `⏱ ${minutes}:${seconds}`;
}

function finishTest() {
  clearInterval(interval);
  document.getElementById("testContainer").innerHTML = `
    <h2>テストが完了しました！</h2>
    <p>${selectedTests.length * 5} 問中 ${score} 問正解しました。</p>
  `;
}

startTest();

document.addEventListener('DOMContentLoaded', () => {
  const themeButton = document.getElementById('toggle-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Установить тему из localStorage или по умолчанию
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    themeButton.textContent = '☀️'; //☀️ 昼モード//
  }

  themeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    themeButton.textContent = isDark ? '☀️' : '🌙'; //'☀️ 昼モード' : '🌙 夜モード'//
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});