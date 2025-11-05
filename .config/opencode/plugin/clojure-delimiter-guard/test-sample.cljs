(ns example.core
  "Example Clojure namespace for testing delimiter guard")

(defn hello-world [name]
  (str "Hello, " name "!"))

(defn calculate-sum [numbers]
  (reduce + numbers))

(defn process-data [data]
  (let [filtered (filter #(> % 0) data)
        processed (map #(* % 2) filtered)]
    (vec processed)))

(defmacro when-let [bindings & body]
  `(if-let ~bindings
     (do ~@body)))

(defn complex-function [x y z]
  (cond
    (> x 10) (str "x is large: " x)
    (< y 5) (str "y is small: " y)
    (= z 0) "z is zero"
    :else (str "x: " x ", y: " y ", z: " z)))

(defn string-operations [text]
  {:upper (clojure.string/upper-case text)
   :lower (clojure.string/lower-case text)
   :reversed (clojure.string/reverse text)})

(defn nested-structures []
  {:users [{:name "Alice" :age 25}
           {:name "Bob" :age 30}]
   :settings {:theme "dark"
               :notifications true}})

(defn set-operations [a b]
  {:union (clojure.set/union a b)
   :intersection (clojure.set/intersection a b)
   :difference (clojure.set/difference a b)})

(defn vector-operations [vec]
  {:first (first vec)
   :last (last vec)
   :count (count vec)
   :reversed (reverse vec)})

(defn anonymous-functions []
  [(map #(+ % 10) [1 2 3])
   (filter #(> % 5) [1 6 2 8 3])
   (reduce * [1 2 3 4])])

(defn error-handling [value]
  (try
    (Integer/parseInt value)
    (catch NumberFormatException e
      (str "Invalid number: " value))
    (finally
      (println "Parsing attempt completed"))))

(defn lazy-sequences []
  (let [nums (iterate inc 1)
        even-nums (filter even? nums)
        first-ten (take 10 even-nums)]
    (vec first-ten)))

(defn protocol-example []
  (defprotocol Shape
    (area [this])
    (perimeter [this]))
  
  (defrecord Circle [radius]
    Shape
    (area [this] (* Math/PI radius radius))
    (perimeter [this] (* 2 Math/PI radius)))
  
  (defrecord Rectangle [width height]
    Shape
    (area [this] (* width height))
    (perimeter [this] (* 2 (+ width height)))))

(defn atom-example []
  (let [counter (atom 0)]
    (swap! counter inc)
    (reset! counter 10)
    @counter))

(defn reader-macros []
  {:set #{1 2 3 4 5}
   :vector [1 2 3 4 5]
   :map {:a 1 :b 2 :c 3}
   :list '(1 2 3 4 5)
   :regex #"\\d+"
   :var #'inc
   :quote '(+ 1 2 3)
   :syntax-quote `(let [x# 1] x#)})

(defn threading-macros []
  (let [data [1 2 3 4 5]]
    {:thread-first (-> data
                       (map #(* % 2))
                       (filter even?)
                       (reduce +))
     :thread-last (->> data
                       (map #(* % 2))
                       (filter even?)
                       (reduce +))}))

(defn js-interop []
  {:alert (js/alert "Hello from ClojureScript!")
   :console-log (js/console.log "Logging to console")
   :document-title (.-title js/document)
   :window-location (.-location js/window)})

(defn async-example []
  (let [promise (js/Promise.resolve 42)]
    (.then promise
           (fn [result]
             (println "Promise resolved with:" result)))))

(defn testing-functions []
  (testing "addition test"
    (is (= (+ 2 3) 5)))
  
  (testing "string test"
    (is (= (str "a" "b") "ab")))
  
  (testing "vector test"
    (is (= (conj [1 2] 3) [1 2 3]))))

(defn metadata-example []
  (let [func-with-meta (with-meta 
                        (fn [x] (* x 2))
                        {:doc "Doubles the input"
                         :author "Test Author"})]
    (:doc (meta func-with-meta))))

(defn multimethod-example []
  (defmulti process-type type)
  
  (defmethod process-type java.lang.String [s]
    (str "String: " s))
  
  (defmethod process-type java.lang.Number [n]
    (str "Number: " n))
  
  (defmethod process-type :default [x]
    (str "Unknown type: " (type x)))
  
  [(process-type "hello")
   (process-type 42)
   (process-type [1 2 3])])

(defn final-example []
  {:message "This is a comprehensive Clojure file for testing the delimiter guard extension"
   :features ["Functions" "Macros" "Protocols" "Atoms" "Reader macros" "Threading" "JS interop"]
   :brackets "() [] {} \"\" #{} #()"}