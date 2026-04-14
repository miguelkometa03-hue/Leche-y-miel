// ─────────────────────────────────────────────────────────────────────────────
// expo/app/(tabs)/agent.tsx
//
// Esta es la pantalla "Agente IA" de la app Pastry-Pro.
// Aquí el usuario puede:
//   1. Chatear con un experto IA en panadería/pastelería
//   2. Tomar foto de un producto y pedir diagnóstico
//   3. Analizar sus fórmulas guardadas con inteligencia artificial
//   4. Generar ideas y optimizar costos
//
// Si es la primera vez, la app le pedirá su API Key de Google AI Studio.
// Una vez ingresada, queda guardada y no hay que volver a escribirla.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Bot,
  Send,
  Camera,
  Key,
  FlaskConical,
  Lightbulb,
  DollarSign,
  ChevronDown,
  Trash2,
  X,
  Sparkles,
} from "lucide-react-native";

import { THEMES } from "@/constants/colors";
import useAppStore from "@/store/useAppStore";
import {
  askAgent,
  getApiKey,
  saveApiKey,
  clearApiKey,
  type ChatMessage,
  type AgentMode,
  AGENT_SUGGESTIONS,
} from "@/utils/geminiAgent";
import type { SavedFormula } from "@/types";

// ── Configuración de los modos del agente ─────────────────────────────────────
// Cada modo tiene su nombre, ícono y color para mostrar en la pantalla

const MODES: {
  id: AgentMode;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}[] = [
  { id: "general",  label: "Chat",      icon: Bot,          color: C.primary },
  { id: "formula",  label: "Fórmula",   icon: FlaskConical, color: C.water },
  { id: "photo",    label: "Foto",      icon: Camera,       color: C.gold },
  { id: "ideas",    label: "Ideas",     icon: Lightbulb,    color: C.success },
  { id: "costs",    label: "Costos",    icon: DollarSign,   color: C.warning },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla principal del Agente IA
// ─────────────────────────────────────────────────────────────────────────────

export default function AgentScreen() {
  // Obtenemos las fórmulas guardadas del store global de la app
  const { formulas, geminiApiKey: storeApiKey, geminiModel, appTheme } = useAppStore();
  const C = THEMES[appTheme] ?? THEMES.trigo; // ✅ FIX #4: tema dinámico

  // ── Estado local de esta pantalla ──────────────────────────────────────────

  // Lista de mensajes del chat (lo que escribió el usuario + respuestas de la IA)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Texto que el usuario está escribiendo en el campo de texto
  const [inputText, setInputText] = useState("");

  // true = la IA está procesando y generando respuesta, false = lista
  const [isLoading, setIsLoading] = useState(false);

  // La API Key guardada del usuario (null = no ha ingresado ninguna todavía)
  const [apiKey, setApiKey] = useState<string | null>(null);

  // true = mostrar el formulario para ingresar la API Key
  const [showKeyForm, setShowKeyForm] = useState(false);

  // Texto del campo donde el usuario escribe su API Key
  const [keyInput, setKeyInput] = useState("");

  // Modo actual del agente (chat general, análisis de fórmula, foto, etc.)
  const [mode, setMode] = useState<AgentMode>("general");

  // La fórmula que el usuario seleccionó para analizar con la IA
  const [selectedFormula, setSelectedFormula] = useState<SavedFormula | null>(null);

  // true = mostrar la lista desplegable de fórmulas para seleccionar
  const [showFormulaList, setShowFormulaList] = useState(false);

  // Imagen que el usuario tomó o eligió de la galería
  const [pickedImage, setPickedImage] = useState<{
    uri: string;
    base64: string;
  } | null>(null);

  // Referencia al ScrollView para hacer scroll automático al nuevo mensaje
  const scrollRef = useRef<ScrollView>(null);

  // ── Al abrir la pantalla: verificar si ya hay API Key guardada ─────────────
  // ✅ FIX: Primero busca en el store (guardado en Ajustes), luego en AsyncStorage
  useEffect(() => {
    const loadKey = async () => {
      // Prioridad 1: key del store (guardada en Ajustes)
      if (storeApiKey && storeApiKey.trim().length > 10) {
        console.log("[Agent] ✅ API Key cargada desde el store");
        setApiKey(storeApiKey);
        setMessages([{
          id: "welcome",
          role: "agent",
          text: "¡Hola! Soy Miel, tu asistente de panadería y pastelería 🍞\n\nPuedo ayudarte a:\n• Analizar y mejorar tus fórmulas\n• Diagnosticar problemas en tus productos (con foto)\n• Generar ideas y variaciones creativas\n• Optimizar tus costos de ingredientes\n\nEscribe tu pregunta o elige un modo arriba para empezar.",
          timestamp: new Date(),
        }]);
        return;
      }
      // Prioridad 2: AsyncStorage (legacy)
      getApiKey().then((key) => {
        if (key) {
          setApiKey(key);
        // Mensaje de bienvenida cuando el agente ya está configurado
        setMessages([
          {
            id: "welcome",
            role: "agent",
            text: "¡Hola! Soy Miel, tu asistente de panadería y pastelería 🍞\n\nPuedo ayudarte a:\n• Analizar y mejorar tus fórmulas\n• Diagnosticar problemas en tus productos (con foto)\n• Generar ideas y variaciones creativas\n• Optimizar tus costos de ingredientes\n\nEscribe tu pregunta o elige un modo arriba para empezar.",
            timestamp: new Date(),
          },
        ]);
          } else {
            setShowKeyForm(true);
          }
        });
      }
    };
    loadKey();
  }, [storeApiKey]);

  // ── Al cambiar de modo, actualizar la fórmula seleccionada ────────────────
  useEffect(() => {
    if (mode === "formula" && formulas.length > 0 && !selectedFormula) {
      // Auto-seleccionar la primera fórmula si estamos en modo fórmula
      setSelectedFormula(formulas[0]);
    }
    if (mode !== "formula" && mode !== "photo") {
      setPickedImage(null);
    }
  }, [mode]);

  // ── Función para guardar la API Key que ingresó el usuario ────────────────
  const handleSaveKey = useCallback(async () => {
    const trimmed = keyInput.trim();

    // Validación básica: las claves de Google AI Studio empiezan con "AIza"
    if (!trimmed.startsWith("AIza") || trimmed.length < 30) {
      Alert.alert(
        "API Key inválida",
        "La API Key debe empezar con 'AIza' y tener al menos 30 caracteres.\n\nEncuéntrala en: aistudio.google.com → Get API Key"
      );
      return;
    }

    try {
      await saveApiKey(trimmed);
      setApiKey(trimmed);
      setShowKeyForm(false);
      setKeyInput("");
      // Mensaje de bienvenida después de configurar la API Key
      setMessages([
        {
          id: "welcome-new",
          role: "agent",
          text: "¡API Key configurada! Soy Miel, tu experto en panadería y pastelería 🍞\n\nYa puedes preguntarme sobre fórmulas, técnicas, diagnóstico de productos y mucho más.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo guardar la API Key. Intenta de nuevo.");
    }
  }, [keyInput]);

  // ── Función para tomar o seleccionar una foto ──────────────────────────────
  const handlePickImage = useCallback(async () => {
    // Le preguntamos al usuario si quiere tomar una foto o elegir de la galería
    Alert.alert("Agregar imagen", "¿De dónde quieres obtener la imagen?", [
      {
        text: "Cámara",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.6,      // 60% de calidad — suficiente para la IA y más liviana
            base64: true,       // necesitamos el base64 para enviarlo a Gemini
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            setPickedImage({
              uri: result.assets[0].uri,
              base64: result.assets[0].base64,
            });
          }
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.6,
            base64: true,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            setPickedImage({
              uri: result.assets[0].uri,
              base64: result.assets[0].base64,
            });
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, []);

  // ── Función principal: enviar mensaje a la IA y obtener respuesta ──────────
  const handleSend = useCallback(async () => {
    // No hacer nada si no hay texto ni imagen, o si ya estamos esperando respuesta
    if ((!inputText.trim() && !pickedImage) || isLoading || !apiKey) return;

    // Texto del mensaje (si no hay texto pero sí imagen, ponemos descripción)
    const messageText = inputText.trim() || "Analiza esta imagen de mi producto.";

    // Agregamos el mensaje del usuario al historial del chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: messageText,
      imageUri: pickedImage?.uri,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    const imageToSend = pickedImage;
    setPickedImage(null);
    setIsLoading(true);

    // Hacemos scroll hacia abajo para ver el nuevo mensaje
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Llamamos al agente IA con todo el contexto
      // ✅ FIX: se pasa `model` que antes faltaba → causaba crash o 404
      const response = await askAgent({
        userMessage: messageText,
        apiKey: apiKey!,
        model: geminiModel || "gemini-1.5-flash",
        mode,
        formula: selectedFormula ?? undefined,
        imageBase64: imageToSend?.base64,
      });

      // Agregamos la respuesta de la IA al historial
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      // Si hubo un error, mostramos un mensaje de error en el chat
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "agent",
        text: `⚠️ ${error instanceof Error ? error.message : "Error al contactar a Gemini. Verifica tu conexión a internet."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      // Scroll al final después de recibir la respuesta
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, pickedImage, isLoading, apiKey, mode, selectedFormula, geminiModel]);

  // ── Función para usar una sugerencia rápida ────────────────────────────────
  const handleSuggestion = useCallback((suggestion: string) => {
    setInputText(suggestion);
  }, []);

  // ── Función para limpiar el chat ───────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    Alert.alert("Limpiar chat", "¿Quieres borrar el historial de conversación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpiar",
        style: "destructive",
        onPress: () => setMessages([]),
      },
    ]);
  }, []);

  // ── Función para cambiar la API Key ───────────────────────────────────────
  const handleChangeKey = useCallback(async () => {
    Alert.alert("Cambiar API Key", "¿Quieres ingresar una nueva API Key?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cambiar",
        onPress: async () => {
          await clearApiKey();
          setApiKey(null);
          setMessages([]);
          setShowKeyForm(true);
        },
      },
    ]);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // PANTALLA DE CONFIGURACIÓN (cuando el usuario aún no ha ingresado su API Key)
  // ─────────────────────────────────────────────────────────────────────────────

  if (showKeyForm) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.keyFormScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Ícono y título */}
            <View style={styles.keyFormIcon}>
              <Sparkles size={36} color={C.primary} />
            </View>
            <Text style={styles.keyFormTitle}>Configura tu Agente IA</Text>
            <Text style={styles.keyFormSubtitle}>
              Para usar el agente, necesitas una API Key gratuita de Google AI Studio.
              Es como una contraseña que le dice a Google que eres tú quien hace las consultas.
            </Text>

            {/* Instrucciones paso a paso */}
            <View style={styles.keySteps}>
              {[
                { n: "1", text: "Ve a aistudio.google.com en tu navegador" },
                { n: "2", text: 'Inicia sesión con tu cuenta de Google' },
                { n: "3", text: 'Haz click en "Get API Key" → "Create API Key"' },
                { n: "4", text: 'Copia la clave (empieza con "AIza...") y pégala aquí' },
              ].map((step) => (
                <View key={step.n} style={styles.keyStep}>
                  <View style={styles.keyStepNum}>
                    <Text style={styles.keyStepNumText}>{step.n}</Text>
                  </View>
                  <Text style={styles.keyStepText}>{step.text}</Text>
                </View>
              ))}
            </View>

            {/* Campo para ingresar la API Key */}
            <View style={styles.keyInputWrap}>
              <Key size={16} color={C.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.keyInput}
                placeholder="AIza..."
                placeholderTextColor={C.textMuted}
                value={keyInput}
                onChangeText={setKeyInput}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />
            </View>

            {/* Nota de privacidad */}
            <Text style={styles.keyNote}>
              🔒 Tu API Key se guarda solo en tu dispositivo. Nadie más puede verla.
              El plan gratuito de Google incluye 1,500 consultas diarias.
            </Text>

            {/* Botón para guardar */}
            <TouchableOpacity
              style={[styles.keyBtn, !keyInput.trim() && styles.keyBtnDisabled]}
              onPress={handleSaveKey}
              disabled={!keyInput.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.keyBtnText}>Activar Agente IA</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PANTALLA PRINCIPAL DEL CHAT
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.agentAvatar}>
              <Bot size={18} color={C.textInverse} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Miel</Text>
              <Text style={styles.headerSub}>Experto en panadería IA</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {/* Botón para cambiar la API Key */}
            <TouchableOpacity
              onPress={handleChangeKey}
              style={styles.headerBtn}
              hitSlop={8}
            >
              <Key size={15} color={C.textMuted} />
            </TouchableOpacity>
            {/* Botón para limpiar el chat */}
            {messages.length > 0 && (
              <TouchableOpacity
                onPress={handleClearChat}
                style={styles.headerBtn}
                hitSlop={8}
              >
                <Trash2 size={15} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── SELECTOR DE MODO ── */}
        {/* Botones para elegir qué tipo de análisis quiere hacer el usuario */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modesRow}
        >
          {MODES.map((m) => {
            const IconComp = m.icon;
            const isActive = mode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.modeBtn,
                  isActive && { backgroundColor: m.color + "22", borderColor: m.color },
                ]}
                onPress={() => setMode(m.id)}
                activeOpacity={0.7}
              >
                <IconComp size={14} color={isActive ? m.color : C.textMuted} />
                <Text
                  style={[
                    styles.modeBtnText,
                    isActive && { color: m.color, fontWeight: "600" as const },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── SELECTOR DE FÓRMULA (solo en modo "Fórmula") ── */}
        {mode === "formula" && formulas.length > 0 && (
          <View style={styles.formulaSelector}>
            <TouchableOpacity
              style={styles.formulaSelectorBtn}
              onPress={() => setShowFormulaList(!showFormulaList)}
              activeOpacity={0.7}
            >
              <FlaskConical size={14} color={C.water} />
              <Text style={styles.formulaSelectorText} numberOfLines={1}>
                {selectedFormula?.name ?? "Seleccionar fórmula..."}
              </Text>
              <ChevronDown size={14} color={C.textMuted} />
            </TouchableOpacity>

            {/* Lista desplegable de fórmulas */}
            {showFormulaList && (
              <View style={styles.formulaList}>
                {formulas.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.formulaListItem,
                      selectedFormula?.id === f.id && styles.formulaListItemActive,
                    ]}
                    onPress={() => {
                      setSelectedFormula(f);
                      setShowFormulaList(false);
                    }}
                  >
                    <Text style={styles.formulaListItemText}>{f.name}</Text>
                    <Text style={styles.formulaListItemSub}>
                      {f.area === "panaderia" ? "Panadería" : "Pastelería"} · {f.hydration}% hid.
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── ÁREA DE MENSAJES DEL CHAT ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* Si no hay mensajes, mostramos sugerencias de preguntas */}
          {messages.length === 0 && (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsTitle}>Preguntas frecuentes</Text>
              {AGENT_SUGGESTIONS[mode].map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Lista de mensajes */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === "user" ? styles.userBubble : styles.agentBubble,
              ]}
            >
              {/* Si el mensaje del usuario incluía una imagen, la mostramos */}
              {msg.imageUri && (
                <Image
                  source={{ uri: msg.imageUri }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.role === "user" ? styles.userText : styles.agentText,
                ]}
              >
                {msg.text}
              </Text>
              {/* Hora del mensaje */}
              <Text style={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}

          {/* Indicador de que la IA está pensando (animación de puntos) */}
          {isLoading && (
            <View style={[styles.messageBubble, styles.agentBubble]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.typingText}>Miel está pensando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── VISTA PREVIA DE LA IMAGEN SELECCIONADA ── */}
        {pickedImage && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: pickedImage.uri }}
              style={styles.imagePreviewThumb}
              resizeMode="cover"
            />
            <Text style={styles.imagePreviewText}>Imagen lista para analizar</Text>
            {/* Botón para quitar la imagen */}
            <TouchableOpacity
              onPress={() => setPickedImage(null)}
              style={styles.imagePreviewRemove}
              hitSlop={6}
            >
              <X size={14} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── BARRA DE ENTRADA DE TEXTO ── */}
        <View style={styles.inputBar}>
          {/* Botón de cámara (solo visible en modo "Foto" o "Chat general") */}
          {(mode === "photo" || mode === "general") && (
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Camera size={20} color={C.primary} />
            </TouchableOpacity>
          )}

          {/* Campo de texto */}
          <TextInput
            style={styles.textInput}
            placeholder={
              mode === "photo"
                ? "Describe el problema o adjunta una foto..."
                : mode === "formula"
                ? "Pregunta sobre tu fórmula..."
                : "Pregunta sobre panadería o pastelería..."
            }
            placeholderTextColor={C.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="default"
          />

          {/* Botón de enviar */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() && !pickedImage) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={(!inputText.trim() && !pickedImage) || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={C.textInverse} />
            ) : (
              <Send size={18} color={C.textInverse} />
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// Usamos los colores del tema oscuro de la app (Colors.light es el tema principal)
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  // ── Pantalla de configuración de API Key ──
  keyFormScroll: {
    padding: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  keyFormIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  keyFormTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: C.text,
    textAlign: "center",
    marginBottom: 12,
  },
  keyFormSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  keySteps: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  keyStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  keyStepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  keyStepNumText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: C.primary,
  },
  keyStepText: {
    fontSize: 13,
    color: C.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  keyInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 12,
  },
  keyInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontFamily: "monospace",
  },
  keyNote: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  keyBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  keyBtnDisabled: {
    opacity: 0.35,
  },
  keyBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.textInverse,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.text,
  },
  headerSub: {
    fontSize: 11,
    color: C.textMuted,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Selector de modo ──
  modesRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.card,
    marginRight: 4,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: C.textMuted,
  },

  // ── Selector de fórmula ──
  formulaSelector: {
    marginHorizontal: 12,
    marginBottom: 8,
    zIndex: 10,
  },
  formulaSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.water,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formulaSelectorText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontWeight: "500" as const,
  },
  formulaList: {
    backgroundColor: C.cardElevated,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    marginTop: 4,
    maxHeight: 200,
    overflow: "hidden" as const,
  },
  formulaListItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  formulaListItemActive: {
    backgroundColor: C.primaryMuted,
  },
  formulaListItemText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: C.text,
  },
  formulaListItemSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  // ── Área de mensajes ──
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 20,
  },

  // ── Sugerencias ──
  suggestions: {
    paddingVertical: 8,
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  suggestionChip: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 13,
    color: C.textSecondary,
  },

  // ── Burbujas de mensajes ──
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 16,
    padding: 12,
    paddingBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userText: {
    color: C.textInverse,
  },
  agentText: {
    color: C.text,
  },
  messageTime: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  // ── Indicador de carga ──
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 13,
    color: C.textMuted,
    fontStyle: "italic" as const,
  },

  // ── Preview de imagen ──
  imagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  imagePreviewThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  imagePreviewText: {
    flex: 1,
    fontSize: 12,
    color: C.textSecondary,
  },
  imagePreviewRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Barra de entrada ──
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    backgroundColor: C.background,
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
});
