const casesRu = {
  'digest-japanese-romance': {
    title: 'Японская романтика через микро-игру',
    why: 'Сильный пример того, как эмоцию лучше материализовать через дыхание, взгляд, пальцы, паузы и небольшие реакции лица, а не описывать абстрактными словами о настроении.',
    signature: 'Эскалация микро-игры: взгляд → заминка → взаимный зрительный контакт.',
    transferable: 'Подходит для реакций основателя или клиента, камерных testimonial-сцен, character-driven case films и сдержанных диалоговых эпизодов.'
  },
  'digest-haute-couture-porcelain': {
    title: 'Фарфоровый couture → трансформация в тушь',
    why: 'Сильный fashion-паттерн: узнаваемая система материала становится драматургическим устройством, а затем переходит во второй визуальный язык.',
    signature: 'Одна материальная система меняет состояние, сохраняя собственную визуальную ДНК.',
    transferable: 'Используй, когда у бренда есть характерный материал, текстура или графическая система, которые можно превратить в правило трансформации.'
  },
  'digest-modern-rural': {
    title: 'Современная craft-реклама',
    why: 'Полезная структура для дизайн-кейсов: сначала обозначить автора или мастера, затем изолировать одно тактильное действие и завершить спокойным lifestyle-пэйоффом.',
    signature: 'Тактильное макро-действие разрешается в спокойный lifestyle-кадр.',
    transferable: 'Подходит для еды, ремесла, hospitality, материалов, производства и бренд-фильмов, где главным героем является сам процесс.'
  },
  'digest-street-racing': {
    title: 'Кинетическая street-racing последовательность',
    why: 'Показывает эскалацию через смену функции кадров: деталь напряжения → раскрытие дороги → ускорение → абстракция скорости.',
    signature: 'Деталь напряжения нарастает до скорости и заканчивается одним чистым hero-pass.',
    transferable: 'Используй для automotive, спорта, gaming и launch-последовательностей, которым нужна контролируемая эскалация.'
  },
  'digest-mini-skincare': {
    title: 'Миниатюрный амбассадор внутри продуктового мира',
    why: 'Инверсия масштаба мгновенно считывается в campaign thumbnail и позволяет построить несколько коротких social-сцен вокруг одного и того же hero SKU.',
    signature: 'Инверсия масштаба превращает продукт в полноценный миниатюрный мир.',
    transferable: 'Подходит для beauty и FMCG-кампаний, где один hero product должен жить в нескольких социальных сценариях, сохраняя единый продуктовый образ.'
  },
  'digest-radiance-serum': {
    title: 'Архитектура → кожа → сыворотка',
    why: 'Классическая грамматика бренд-фильма: архитектура сначала задаёт ценности бренда, кожа демонстрирует benefit, а packshot закрывает сообщение.',
    signature: 'Архитектура формирует perception бренда до демонстрации skin benefit и продукта.',
    transferable: 'Используй для premium-продуктов, где окружение способно передать ценности бренда ещё до появления упаковки.'
  },
  'digest-fish-ad': {
    title: 'От ингредиента к готовому блюду',
    why: 'Чёткая переиспользуемая коммерческая арка: исходный материал → процесс трансформации → plated hero → человеческое подтверждение.',
    signature: 'Сама трансформация является сюжетом: raw → process → heat → plated payoff.',
    transferable: 'Подходит для любого продукта, где процесс изменения визуально выразителен: еда, косметика, материалы и производство.'
  },
  'digest-moxie-curl': {
    title: 'Демонстрация beauty-benefit',
    why: 'Соединяет строгую точность упаковки с видимым before/after benefit и editorial packshot — структура хорошо переносится на FMCG и beauty.',
    signature: 'Преимущество продукта доказывается физикой волос или материала, а не текстовым обещанием.',
    transferable: 'Используй в ситуациях, где benefit продукта можно физически показать в кадре вместо того, чтобы описывать его словами.'
  },
  'digest-gold-morph': {
    title: 'Материальный ассоциативный луп',
    why: 'Отличный motion-identity паттерн: material DNA сохраняется при изменении силуэта, а цепочка замыкается обратно в исходную форму. Полезно для logo stings и brand worlds.',
    signature: 'Непрерывный morph-loop с наследованием материала, отражений и кривизны.',
    transferable: 'Подходит для logo stings, переходов внутри brand world, website hero и зацикленной identity-анимации.'
  },
  'digest-camera-minimal': {
    title: 'Минимальный каркас движения камеры',
    why: 'Полезный антипример overprompting: когда reference image уже содержит арт-дирекшн, инструкция только по движению часто работает сильнее повторного описания всего визуала.',
    signature: 'Изображение отвечает за арт-дирекшн; промпт отвечает только за движение.',
    transferable: 'Используй для утверждённых key visual, постеров, UI-компов и campaign images, когда модель не должна переизобретать дизайн.'
  },
  'digest-fisheye-dancer': {
    title: 'Street editorial с fisheye-оптикой',
    why: 'Показывает, как одно жёсткое оптическое правило может объединить хаотичное youth-culture движение и стать узнаваемым campaign device.',
    signature: 'Одно экстремальное оптическое правило объединяет хаотичное движение.',
    transferable: 'Используй для youth culture, fashion, music и спорта, когда единое lens-rule должно стать частью campaign identity.'
  },
  'digest-beauty-advent': {
    title: 'Beauty-unboxing через продуктовую иерархию',
    why: 'Сильный ecommerce-паттерн: простая грамматика камеры, последовательное раскрытие продуктов и перевод фокуса в роли визуального перехода.',
    signature: 'Перевод фокуса становится переходом между creator и продуктовой иерархией.',
    transferable: 'Подходит для ecommerce-unboxing, наборов, feature ladders и creator-led последовательностей раскрытия продукта.'
  },
  'digest-suitcase': {
    title: 'Макро-демонстрация функций продукта',
    why: 'Одна из самых переиспользуемых ecommerce-структур: каждый кадр доказывает одну физическую характеристику, а все кадры наследуют единый master-reference продукта.',
    signature: 'Каждый кадр доказывает ровно одну физическую функцию продукта.',
    transferable: 'Используй для durable goods, hardware, electronics и любых продуктов, чьи физические особенности можно показать отдельными проверяемыми действиями.'
  },
  'digest-blender': {
    title: 'Продуктовый demo через creator',
    why: 'Соединяет spokesperson, доказательство продукта и финальный packshot в одной social-ad арке, при этом каждое действие легко проверить визуально.',
    signature: 'Каждое заявленное преимущество сразу подтверждается видимым действием продукта.',
    transferable: 'Подходит для creator ads, где за каждым spoken claim может следовать одно конкретное и визуально проверяемое действие.'
  },
  'digest-golden-serum': {
    title: 'Beauty-система от капли к packshot',
    why: 'Компактная символическая система — liquid macro, контакт с кожей и gemstone-like packshot — создаёт brand equity без сложного сюжета.',
    signature: 'Одна жидкостная или материальная метафора связывает benefit и packshot.',
    transferable: 'Используй для жидкостей, fragrance, skincare и premium product films, где материал может нести основную идентичность ролика.'
  },
  'digest-fashion-mall': {
    title: 'Энергичный retail-fashion монтаж',
    why: 'Исходник намеренно максималистский. Porter-версия показывает, как сохранить retail-energy, разделив движения камеры на чистые и воспроизводимые шоты.',
    signature: 'Retail-energy создаётся монтажной грамматикой, а не постоянной сменой визуальной идентичности.',
    transferable: 'Подходит для launch edits, где несколько окружений или образов будут собираться уже на посте из отдельных чистых генераций.'
  },
  'digest-water-skincare': {
    title: 'Beauty-фильм на метафоре чистоты',
    why: 'Одна материальная метафора соединяет opener, benefit shot и финальный brand frame без сложной сюжетной continuity.',
    signature: 'Одна метафора чистоты повторяется в opener, benefit и финальном кадре.',
    transferable: 'Используй, когда одна простая метафора способна пронести визуальную идентичность через весь короткий ролик.'
  },
  'digest-soda-monster': {
    title: 'Beverage-трансформация через бренд-персонажа',
    why: 'Сильный branded-content паттерн: эмоциональное состояние персонажа и lighting state мира меняются ровно в момент появления product benefit.',
    signature: 'Активация продукта одновременно меняет эмоцию персонажа и световое состояние мира.',
    transferable: 'Подходит, когда маскот и продукт должны иметь причинно-следственную связь, а не просто декоративно находиться в одном кадре.'
  },
  'digest-night-market': {
    title: 'Аутентичный product-in-context vlog',
    why: 'Полезный digital-паттерн, где «несовершенство» задаётся как система: handheld, breathing exposure, ambient audio и ограниченное поведение людей на фоне.',
    signature: 'Контролируемое несовершенство превращается в повторяемую визуальную систему.',
    transferable: 'Используй для hospitality, food и lifestyle-кампаний, где believable handheld imperfection, ambient sound, сдержанная реакция и product-in-context создают убедительный social proof.'
  },
  'digest-idol-homevideo': {
    title: 'Фильм-воспоминание для personal brand',
    why: 'Сильный storytelling device для фаундеров, talent и брендов: ожидание строится через бытовые BTS-детали, а не через постоянный spectacle.',
    signature: 'Обычные backstage-детали постепенно создают ожидание важного события.',
    transferable: 'Подходит для агентских кейсов, запусков, founders, мероприятий и process documentaries, где путь к событию важнее самого финального spectacle.'
  },
  'digest-werewolf': {
    title: 'Editorial-трансформация человека в существо',
    why: 'Полезный VFX-паттерн: несколько identity/accessory anchors сохраняются, пока меняется только одно состояние тела или материала. Сильная основа для fashion, gaming и campaign reveals.',
    signature: 'Identity anchors остаются неизменными, пока трансформируется только одно телесное или материальное состояние.',
    transferable: 'Используй для fashion, gaming, beauty и reveal-концептов, построенных вокруг контролируемой метаморфозы без потери исходной идентичности.'
  },
  'digest-seattle-chase': {
    title: 'Проблема → погоня → deadpan payoff',
    why: 'Рекламный инсайт: очень кинетическая середина становится запоминающейся именно потому, что финальный payoff полностью статичен. Отлично работает для campaign и case-film rhythm.',
    signature: 'Кинетическая середина становится сильнее благодаря полностью статичной развязке.',
    transferable: 'Подходит для ad и case-film нарративов, где тривиальная задача намеренно подаётся с непропорционально высокой кинематографической серьёзностью.'
  },
  'digest-1950s-drama': {
    title: 'Система блокинга для period editorial',
    why: 'Полезный дизайн-урок: ощущение эпохи возникает из композиции, blocking, lens rules и движения камеры, а не из одного vintage-filter.',
    signature: 'Достоверность эпохи строится через blocking и композиционные правила, а не через фильтр.',
    transferable: 'Используй, когда исторический или жанровый визуальный язык должен формироваться правилами кинематографии, а не эффектами поверх изображения.'
  },
  'digest-tennis': {
    title: 'Freeze-frame reveal спортивного продукта',
    why: 'Паттерн sports + product detail: действие останавливается в пиковой фазе, чтобы рассмотреть apparel или equipment, затем движение возвращается в брендовый финал.',
    signature: 'Пиковое спортивное действие замирает, чтобы кампания могла рассмотреть продуктовую деталь.',
    transferable: 'Подходит для sportswear, оборудования и product films, где динамику можно временно остановить ради демонстрации деталей дизайна.'
  }
};

const phraseRu = {
  'Hook / setup':'Хук / постановка',
  'Payoff / endpoint':'Развязка / endpoint',
  'Development':'Развитие',
  'Continuous take / single visual rule':'Непрерывный take / одно визуальное правило',
  'Establish the visual rule and subject hierarchy.':'Задать визуальное правило и иерархию объектов.',
  'Resolve the idea into a memorable or useful endpoint.':'Разрешить идею в запоминающийся и полезный endpoint.',
  'Advance one visible state change without resetting the visual logic.':'Продвинуть одно видимое изменение состояния, не сбрасывая визуальную логику.',
  'Carry forward subject identity, geometry, material and lighting rules from the previous beat.':'Сохранить из предыдущего бита идентичность, геометрию, материал и правила света.',
  'The first beat must make the core visual grammar legible immediately.':'Первый бит должен мгновенно сделать основную визуальную грамматику понятной.',
  'The final beat converts motion into a clear campaign, product or narrative payoff.':'Финальный бит превращает движение в ясную рекламную, продуктовую или сюжетную развязку.',
  'This beat creates progression while keeping cognitive load low.':'Этот бит создаёт развитие, не перегружая зрителя.',
  'Create contrast and resolve the sequence.':'Создать контраст и завершить последовательность.',
  'Advance the action with one clear camera function.':'Продвинуть действие через одну понятную функцию камеры.',
  'Keep the same story object, identity and world logic across clips.':'Сохранять один и тот же сюжетный объект, идентичность и логику мира между клипами.',
  'The endpoint changes rhythm so the concept becomes memorable.':'Endpoint меняет ритм и благодаря этому делает концепт запоминающимся.',
  'Each clip isolates one piece of action that would be brittle if overloaded into a single generation.':'Каждый клип изолирует одно действие, которое стало бы хрупким при попытке перегрузить одну генерацию.',
  'Keep one visual rule legible for the entire clip instead of manufacturing unnecessary cuts.':'Сохранять одно визуальное правило читаемым на протяжении всего клипа вместо искусственного добавления монтажных склеек.',
  'The same subject, material, lighting direction and camera rule persist continuously from first frame to endpoint.':'Один и тот же объект, материал, направление света и правило камеры непрерывно сохраняются от первого кадра до endpoint.',
  'This case is strong precisely because continuity is the effect; splitting it into artificial shots would weaken the pattern.':'Сила этого кейса именно в непрерывности как эффекте; искусственное дробление на шоты ослабило бы паттерн.',
  'Separates the concept into ordered beats instead of one overloaded instruction.':'Разделяет концепт на последовательные биты вместо одной перегруженной инструкции.',
  'Uses macro framing to turn surface/material detail into product evidence.':'Использует macro-framing, чтобы превратить свойства поверхности или материала в доказательство качества продукта.',
  'Assigns a clear information function to camera movement rather than using motion decoratively.':'Назначает движению камеры конкретную информационную функцию вместо декоративного движения.',
  'Defines what must remain invariant while the silhouette or material state changes.':'Явно определяет, что обязано оставаться неизменным при смене силуэта или состояния материала.',
  'Resolves into a stable product endpoint suitable for typography/branding in post.':'Завершает ролик стабильным product endpoint, пригодным для типографики и брендинга на посте.',
  'Uses rhythm interruption to create a product-inspection beat inside action.':'Использует разрыв ритма, чтобы встроить момент детального рассмотрения продукта внутрь действия.',
  'Keeps one dominant visible action per beat and preserves stable subject/world anchors.':'Оставляет одно доминирующее видимое действие на бит и сохраняет стабильные anchors объекта и мира.',
  'Use the primary image as a strict identity/product/geometry anchor.':'Используй основной image reference как жёсткий anchor идентичности, продукта и геометрии.',
  'Assign each additional reference one job only.':'Назначай каждому дополнительному референсу только одну функцию.',
  'References are optional; if introduced, give each asset one explicit role.':'Референсы опциональны; если они добавлены, у каждого asset должна быть одна явная роль.',
  'Camera movement is structural: one dominant move per shot.':'Движение камеры является структурным: одно доминирующее движение на шот.',
  'Static shots are used deliberately where clarity matters.':'Статичные кадры используются намеренно там, где важнее ясность.',
  'Camera remains subordinate to the concept and subject hierarchy.':'Камера остаётся подчинена концепту и иерархии объектов.',
  'Generate clean source shots and perform exact match cuts in post.':'Генерируй чистые source shots, а точные match cuts выполняй на посте.',
  'Transition is motivated by the visible state change, not added as generic spectacle.':'Переход мотивирован видимым изменением состояния, а не добавлен как универсальный spectacle-эффект.',
  'Cuts/state changes should preserve visual continuity.':'Склейки и изменения состояния должны сохранять визуальную continuity.',
  'Material behavior, reflectivity, weight and continuity are treated as identity anchors.':'Поведение материала, reflectivity, вес и continuity рассматриваются как identity anchors.',
  'Material rules should remain stable across shots.':'Правила материала должны оставаться стабильными между шотами.',
  'Audio reinforces the visible action/rhythm and should not compete with the visual idea.':'Звук усиливает видимое действие и ритм и не должен конкурировать с визуальной идеей.',
  'Audio is secondary; add only when it clarifies rhythm or physical action.':'Звук вторичен; добавляй его только если он проясняет ритм или физическое действие.',
  'Hybrid finish expected: preserve generation for motion/atmosphere and composite exact typography, UI or brand geometry in post.':'Ожидается hybrid-finish: генерация отвечает за движение и атмосферу, а точная типографика, UI и брендовая геометрия композятся на посте.',
  'Light finishing expected: color, sound, cleanup and exact brand/text elements should remain post-production responsibilities.':'Ожидается лёгкий finishing: цвет, звук, cleanup и точные brand/text элементы остаются задачей постпродакшна.',
  'Use ordered Shot N blocks rather than relying on brittle exact timestamps.':'Используй последовательные блоки Shot N вместо хрупкой привязки к точным таймкодам.',
  'Keep one dominant camera movement per shot.':'Оставляй одно доминирующее движение камеры на шот.',
  'Give every reference one explicit job and preserve stable identity/product anchors.':'Давай каждому референсу одну явную функцию и сохраняй стабильные identity/product anchors.',
  'Do not rely on Seedance for exact brand typography when post-compositing is safer.':'Не полагайся на Seedance для точной брендовой типографики, если безопаснее добавить её на посте.'
};

const riskRu = {
  'overmoving an approved composition':'слишком сильное движение утверждённой композиции',
  'generated typography drift':'дрейф сгенерированной типографики',
  'invented interface controls':'выдуманные элементы интерфейса',
  'unreadable UI typography':'нечитаемая UI-типографика',
  'too many states inside one clip':'слишком много состояний внутри одного клипа',
  'screen geometry drift':'дрейф геометрии экрана',
  'fake data labels':'выдуманные data labels',
  'misaligned UI hierarchy':'сломанная UI-иерархия',
  'generic cinematic shots with no information hierarchy':'общие cinematic shots без информационной иерархии',
  'too much narrative for 15 seconds':'слишком много нарратива для 15 секунд',
  'logo distortion':'искажение логотипа',
  'unmotivated particle clutter':'немотивированный визуальный шум из частиц',
  'old/new identity mixing unintentionally':'случайное смешивание старой и новой айдентики',
  'loss of exact logo geometry':'потеря точной геометрии логотипа',
  'generated letterform errors':'ошибки в форме букв',
  'overcomplicated transforms':'чрезмерно сложные трансформации',
  'unreadable text':'нечитаемый текст',
  'model-generated spelling errors':'орфографические ошибки модели',
  'camera movement replaces actual interaction logic':'движение камеры подменяет реальную логику взаимодействия',
  'unstable UI geometry':'нестабильная UI-геометрия',
  'package/logo drift':'дрейф упаковки или логотипа',
  'duplicate product':'дублирование продукта',
  'plastic skin':'пластиковая кожа',
  'unrealistic hair/liquid physics':'нереалистичная физика волос или жидкости',
  'packaging inconsistency':'несогласованная упаковка',
  'invented claims/text':'выдуманные claims или текст',
  'ingredient morphing':'морфинг ингредиентов',
  'unrealistic heat/liquid behavior':'нереалистичное поведение тепла или жидкости',
  'wheel/body deformation':'деформация колёс или кузова',
  'reflection discontinuity':'разрыв отражений',
  'wardrobe drift':'дрейф одежды',
  'body/garment fusion':'слипание тела и одежды',
  'anatomy/action physics errors':'ошибки анатомии или физики действия',
  'equipment deformation':'деформация оборудования',
  'visual clutter reduces perceived value':'визуальный шум снижает perceived value',
  'CGI gloss instead of material realism':'CGI-блеск вместо реалистичности материала',
  'port/button geometry drift':'дрейф геометрии портов или кнопок',
  'screen text artifacts':'артефакты текста на экране',
  'architecture morphing':'морфинг архитектуры',
  'impossible spatial continuity':'невозможная пространственная continuity',
  'compound camera moves':'составные движения камеры',
  'camera teleportation':'телепортация камеры',
  'transition becomes unrelated scene change':'переход превращается в несвязанную смену сцены',
  'continuity loss':'потеря continuity',
  'unmotivated topology noise':'немотивированный topology noise',
  'identity loss during metamorphosis':'потеря identity во время метаморфозы',
  'depth-of-field hides the actual feature':'DOF скрывает реальную функцию или деталь',
  'surface artifacts':'артефакты поверхности',
  'incorrect weight/reflectivity':'неверный вес или reflectivity материала',
  'material changes between shots':'материал меняется между кадрами',
  'first/last state mismatch':'несовпадение первого и последнего состояния',
  'visible discontinuity':'видимый разрыв лупа',
  'subject anatomy breaks during freeze':'анатомия ломается во время freeze',
  'motion restart does not match':'возобновление движения не совпадает с freeze-state',
  'inconsistent relative size':'нестабильный относительный масштаб',
  'contact shadows break scale illusion':'контактные тени ломают иллюзию масштаба',
  'AI is asked to edit instead of generating clean source shots':'AI просят делать монтаж вместо генерации чистых source shots',
  'geometry mismatch':'несовпадение геометрии',
  'endpoint overconstrained':'endpoint перегружен ограничениями',
  'interpolation invents geometry':'интерполяция выдумывает геометрию'
};

export function getCaseLocale(id, language) {
  if (language !== 'ru') return null;
  return casesRu[id] || null;
}
export function translateAnalysisPhrase(value, language) {
  if (language !== 'ru') return value;
  return phraseRu[value] || riskRu[value] || value;
}
