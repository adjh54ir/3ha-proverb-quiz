import React, { useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EditModal = ({ visible, onClose, item, onUpdate }) => {
  // 필수 값
  const STORAGE_KEY = "fixedExpenses";
  const [formData, setFormData] = useState(item);

  /**
   * 함수 필수 값
   */
  const editModalHandler = (() => {
    return {
      /**
       * 닫기 함수
       * @returns
       */
      close: () => onClose(),

      /**
       * 수정 함수
       * @returns
       */
      edit: async () => {
        try {
          // 기본 유효성 검사
          if (!formData.name.trim()) {
            Alert.alert("오류", "지출명을 입력해주세요.");
            return;
          }
          if (formData.amount <= 0) {
            Alert.alert("오류", "금액을 올바르게 입력해주세요.");
            return;
          }
          if (!formData.parentCategory || !formData.subCategory) {
            Alert.alert("오류", "카테고리를 선택해주세요.");
            return;
          }
          if (!formData.bankName) {
            Alert.alert("오류", "출금은행을 선택해주세요.");
            return;
          }
          if (formData.withdrawalDay < 1 || formData.withdrawalDay > 31) {
            Alert.alert("오류", "출금일자는 1-31 사이의 값이어야 합니다.");
            return;
          }
          if (formData.repeatMonths <= 0) {
            Alert.alert("오류", "반복 주기를 올바르게 입력해주세요.");
            return;
          }

          // 업데이트된 데이터 저장
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
          onUpdate(formData);
          Alert.alert("성공", "수정이 완료되었습니다.");
          editModalHandler.close();
        } catch (error) {
          console.error("Error saving expense:", error);
          Alert.alert("오류", "수정 중 오류가 발생했습니다.");
        }
      },
    };
  })();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={editModalHandler.close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >

        <View style={editStyles.modalContainer}>
          <View style={editStyles.modalContent}>
            <View style={editStyles.modalHeader}>
              <Text style={editStyles.modalTitle}>고정지출 수정</Text>
              <TouchableOpacity onPress={editModalHandler.close}>
                <FontAwesomeIcon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={editStyles.form}>
              <View style={editStyles.formGroup}>
                <Text style={editStyles.label}>지출명</Text>
                <TextInput
                  style={editStyles.input}
                  value={item.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="지출명을 입력하세요"
                />
              </View>

              <View style={editStyles.formGroup}>
                <Text style={editStyles.label}>금액</Text>
                <TextInput
                  style={editStyles.input}
                  value={String(formData.amount)}
                  onChangeText={(text) =>
                    setFormData({ ...formData, amount: Number(text) })
                  }
                  placeholder="금액을 입력하세요"
                  keyboardType="numeric"
                />
              </View>

              <View style={editStyles.formGroup}>
                <Text style={editStyles.label}>카테고리</Text>
              </View>

              <View style={editStyles.formGroup}>
                <Text style={editStyles.label}>출금은행</Text>
              </View>

              <View style={editStyles.formGroup}>
                <Text style={editStyles.label}>반복 개월</Text>
              </View>

              <View style={editStyles.formGroup}>
                <Text style={editStyles.label}>출금일</Text>
              </View>
            </ScrollView>

            <View style={editStyles.buttonContainer}>
              <TouchableOpacity
                style={[editStyles.cancelButton]}
                onPress={editModalHandler.close}
              >
                <Text style={editStyles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[editStyles.saveButton]}
                onPress={editModalHandler.edit}
              >
                <Text style={editStyles.saveButtonText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
export default EditModal;

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },
  searchTextInputStyle: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    height: 50,
  },
  modalContentContainerStyle: {
    backgroundColor: "#fff",
    paddingTop: 20,
    height: Dimensions.get("window").height * 0.8,
  },
});

const editStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    position: "relative",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
    position: "relative",
    zIndex: 1,
    overflow: "hidden",
    alignSelf: "center",
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  form: {
    padding: 16,
    position: "relative",
    zIndex: 2,
  },
  formGroup: {
    marginBottom: 16,
    position: "relative",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  imageButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: "#666",
    fontSize: 16,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  deleteImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 20,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownContainer: {
    position: "absolute",
    zIndex: 1100,
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownIcon: {
    marginRight: 8,
  },
  selectedDropdownItem: {
    backgroundColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#000",
  },
  selectedDropdownItemText: {
    color: "#007AFF",
  },
  selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    zIndex: 4,
  },
  selectBoxContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectBoxText: {
    fontSize: 16,
    color: "#000",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  periodInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    fontSize: 16,
  },
  periodText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  listItemContainerStyle: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 10,
  },
});
